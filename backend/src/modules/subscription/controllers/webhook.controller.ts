import {
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeService } from '../services/stripe.service';
import { SubscriptionService } from '../services/subscription.service';
import { WebhookEvent } from '../models/webhook-event.model';
import { Public } from '../../../decorators/public.decorator';
import Stripe from 'stripe';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';

@Controller('stripe')
export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepo: Repository<WebhookEvent>,
  ) {}

  @Public()
  @Post('webhook')
  public async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.webhookOperation,
      'handle_webhook',
    );

    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      LogHelpers.addBusinessContext(
        BusinessContextKeys.webhookError,
        'missing_signature',
      );

      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing Stripe signature header');
    }

    if (!req.rawBody) {
      LogHelpers.addBusinessContext(
        BusinessContextKeys.webhookError,
        'missing_raw_body',
      );

      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing raw body for webhook verification');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    } catch (err) {
      LogHelpers.addBusinessContext(
        BusinessContextKeys.webhookVerificationFailed,
        true,
      );
      LogHelpers.addBusinessContext(
        BusinessContextKeys.verificationError,
        err.message,
      );

      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook verification failed: ${err.message}`);
    }

    LogHelpers.addBusinessContext(BusinessContextKeys.stripeEventId, event.id);
    LogHelpers.addBusinessContext(
      BusinessContextKeys.stripeEventType,
      event.type,
    );
    LogHelpers.addBusinessContext(
      BusinessContextKeys.stripeCreated,
      event.created,
    );

    const webhookEvent = this.webhookEventRepo.create({
      stripeEventId: event.id,
      eventType: event.type,
      processed: false,
    });

    try {
      await this.webhookEventRepo.save(webhookEvent);
      LogHelpers.addBusinessContext(
        BusinessContextKeys.webhookEventSaved,
        true,
      );
    } catch (error) {
      if (error.code === '23505') {
        LogHelpers.addBusinessContext(
          BusinessContextKeys.webhookDuplicate,
          true,
        );
        LogHelpers.addBusinessContext(
          BusinessContextKeys.duplicateEventId,
          event.id,
        );

        return res
          .status(HttpStatus.OK)
          .json({ received: true, duplicate: true });
      }

      LogHelpers.addBusinessContext(
        BusinessContextKeys.webhookSaveError,
        error.message,
      );
      LogHelpers.addBusinessContext(BusinessContextKeys.errorCode, error.code);
      throw error;
    }

    try {
      await this.processWebhookEvent(event, webhookEvent.id);
      LogHelpers.addBusinessContext(
        BusinessContextKeys.webhookProcessingComplete,
        true,
      );

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (err) {
      LogHelpers.addBusinessContext(
        BusinessContextKeys.webhookProcessingFailed,
        true,
      );
      LogHelpers.addBusinessContext(
        BusinessContextKeys.processingError,
        err.message,
      );
      LogHelpers.addBusinessContext(BusinessContextKeys.errorStack, err.stack);

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Webhook processing failed', message: err.message });
    }
  }

  private async processWebhookEvent(
    event: Stripe.Event,
    webhookEventId: number,
  ): Promise<void> {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.processingEventType,
      event.type,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const updateResult =
          await this.subscriptionService.handleSubscriptionUpdate(
            event.data.object,
          );

        if (updateResult.isError()) {
          LogHelpers.addBusinessContext(
            'subscription_update_failed',
            updateResult.value.message,
          );
          LogHelpers.addBusinessContext(
            'subscription_update_error_code',
            updateResult.value.code,
          );
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const deleteResult =
          await this.subscriptionService.handleSubscriptionDeleted(
            event.data.object,
          );

        if (deleteResult.isError()) {
          LogHelpers.addBusinessContext(
            'subscription_delete_failed',
            deleteResult.value.message,
          );
          LogHelpers.addBusinessContext(
            'subscription_delete_error_code',
            deleteResult.value.code,
          );
        }

        break;
      }

      default:
        LogHelpers.addBusinessContext(
          BusinessContextKeys.unhandledEventType,
          event.type,
        );
        LogHelpers.addBusinessContext(BusinessContextKeys.unhandledEvent, true);
    }

    await this.webhookEventRepo.update(webhookEventId, {
      processed: true,
      processedAt: new Date(),
    });

    LogHelpers.addBusinessContext(BusinessContextKeys.webhookProcessed, true);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.checkoutHandler,
      'processing',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.sessionId, session.id);
    LogHelpers.addBusinessContext(
      BusinessContextKeys.sessionMode,
      session.mode,
    );

    if (session.mode !== 'subscription') {
      LogHelpers.addBusinessContext(
        BusinessContextKeys.checkoutSkipped,
        'not_subscription',
      );

      return;
    }

    if (!session.subscription) {
      LogHelpers.addBusinessContext(
        BusinessContextKeys.checkoutError,
        'missing_subscription_id',
      );
      LogHelpers.addBusinessContext(
        BusinessContextKeys.sessionStatus,
        session.status,
      );

      throw new Error('Checkout session completed but missing subscription ID');
    }

    LogHelpers.addBusinessContext(
      'checkout_subscription_id',
      session.subscription as string,
    );

    const subscription = await this.stripeService.getSubscription(
      session.subscription as string,
    );

    LogHelpers.addBusinessContext(
      BusinessContextKeys.subscriptionStatus,
      subscription.status,
    );

    const result =
      await this.subscriptionService.handleSubscriptionUpdate(subscription);

    if (result.isError()) {
      LogHelpers.addBusinessContext(
        'checkout_processing_error',
        result.value.message,
      );
      LogHelpers.addBusinessContext(
        'checkout_processing_error_code',
        result.value.code,
      );
    }

    LogHelpers.addBusinessContext(BusinessContextKeys.checkoutCompleted, true);
  }
}
