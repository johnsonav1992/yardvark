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

@Controller('stripe')
export class WebhookController {
  constructor(
    private stripeService: StripeService,
    private subscriptionService: SubscriptionService,
    @InjectRepository(WebhookEvent)
    private webhookEventRepo: Repository<WebhookEvent>,
  ) {}

  @Public()
  @Post('webhook')
  public async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const signature = req.headers['stripe-signature'] as string;

    if (!req.rawBody) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing raw body for webhook verification');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    } catch (err) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }

    LogHelpers.addBusinessContext('stripe_event_id', event.id);
    LogHelpers.addBusinessContext('stripe_event_type', event.type);

    const webhookEvent = this.webhookEventRepo.create({
      stripeEventId: event.id,
      eventType: event.type,
      processed: false,
    });

    try {
      await LogHelpers.withDatabaseTelemetry(() =>
        this.webhookEventRepo.save(webhookEvent),
      );
    } catch (error) {
      if (error.code === '23505') {
        LogHelpers.addBusinessContext('webhook_duplicate', true);
        return res
          .status(HttpStatus.OK)
          .json({ received: true, duplicate: true });
      }
      throw error;
    }

    try {
      await this.processWebhookEvent(event, webhookEvent.id);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (err) {
      LogHelpers.addBusinessContext('webhook_processing_error', err.message);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Webhook processing failed' });
    }
  }

  private async processWebhookEvent(
    event: Stripe.Event,
    webhookEventId: number,
  ): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.subscriptionService.handleSubscriptionUpdate(
          event.data.object,
        );
        break;

      case 'customer.subscription.deleted':
        await this.subscriptionService.handleSubscriptionDeleted(
          event.data.object,
        );
        break;

      default:
        LogHelpers.addBusinessContext('unhandled_event', true);
    }

    await LogHelpers.withDatabaseTelemetry(() =>
      this.webhookEventRepo.update(webhookEventId, {
        processed: true,
        processedAt: new Date(),
      }),
    );

    LogHelpers.addBusinessContext('webhook_processed', true);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription') {
      return;
    }

    if (!session.subscription) {
      LogHelpers.addBusinessContext('checkout_missing_subscription', true);
      return;
    }

    const subscription = await this.stripeService.getSubscription(
      session.subscription as string,
    );

    await this.subscriptionService.handleSubscriptionUpdate(subscription);

    LogHelpers.addBusinessContext('checkout_completed', true);
  }
}
