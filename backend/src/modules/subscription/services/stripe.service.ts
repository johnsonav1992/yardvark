import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LogHelpers } from '../../../logger/logger.helpers';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  async createCustomer(
    userId: string,
    email: string,
    name: string,
  ): Promise<Stripe.Customer> {
    LogHelpers.addBusinessContext('stripe_operation', 'create_customer');
    LogHelpers.addBusinessContext('userId', userId);

    return LogHelpers.withExternalCallTelemetry('stripe', () =>
      this.stripe.customers.create({
        email,
        name,
        metadata: { userId },
      }),
    );
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    LogHelpers.addBusinessContext('stripe_operation', 'create_checkout');
    LogHelpers.addBusinessContext('userId', userId);
    LogHelpers.addBusinessContext('priceId', priceId);

    return LogHelpers.withExternalCallTelemetry('stripe', () =>
      this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId },
        subscription_data: { metadata: { userId } },
      }),
    );
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    LogHelpers.addBusinessContext('stripe_operation', 'create_portal');

    return LogHelpers.withExternalCallTelemetry('stripe', () =>
      this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      }),
    );
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    LogHelpers.addBusinessContext('stripe_operation', 'get_subscription');

    return LogHelpers.withExternalCallTelemetry('stripe', () =>
      this.stripe.subscriptions.retrieve(subscriptionId),
    );
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    LogHelpers.addBusinessContext('stripe_operation', 'cancel_subscription');
    LogHelpers.addBusinessContext('subscriptionId', subscriptionId);

    return LogHelpers.withExternalCallTelemetry('stripe', () =>
      this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      }),
    );
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      LogHelpers.addBusinessContext('webhook_verification_failed', true);

      throw err;
    }
  }

  getStripe(): Stripe {
    return this.stripe;
  }
}
