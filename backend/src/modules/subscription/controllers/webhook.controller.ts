import {
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service';
import { SubscriptionService } from '../services/subscription.service';
import { Public } from '../../../decorators/public.decorator';
import Stripe from 'stripe';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('stripe')
export class WebhookController {
  constructor(
    private stripeService: StripeService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Public()
  @Post('webhook')
  async handleWebhook(
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

    try {
      LogHelpers.addBusinessContext('stripe_event_type', event.type);

      switch (event.type) {
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

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (err) {
      LogHelpers.addBusinessContext('webhook_error', err.message);

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Webhook handler failed: ${err.message}`);
    }
  }
}
