import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Subscription } from '../models/subscription.model';
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
  SubscriptionTier,
  SubscriptionStatus,
  PurchasableTier,
} from '../models/subscription.types';
import { FeatureUsage } from '../models/usage.model';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LogHelpers } from '../../../logger/logger.helpers';

export type FeatureAccessResult = {
  allowed: boolean;
  limit?: number;
  usage?: number;
};

@Injectable()
export class SubscriptionService {
  private readonly FREE_TIER_ENTRY_LIMIT = 6;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(FeatureUsage)
    private usageRepo: Repository<FeatureUsage>,
    private stripeService: StripeService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(userId: string): string {
    return `subscription:${userId}`;
  }

  private async getCachedSubscription(
    userId: string,
  ): Promise<Subscription | null> {
    try {
      const cached = await this.cacheManager.get<Subscription>(
        this.getCacheKey(userId),
      );

      if (cached) {
        LogHelpers.addBusinessContext('subscription_cache_hit', true);
        return cached;
      }

      return null;
    } catch (error) {
      LogHelpers.addBusinessContext('cache_get_error', error.message);
      LogHelpers.addBusinessContext('cache_user_id', userId);
      return null;
    }
  }

  private async cacheSubscription(
    userId: string,
    subscription: Subscription,
  ): Promise<void> {
    try {
      await this.cacheManager.set(this.getCacheKey(userId), subscription);
    } catch (error) {
      LogHelpers.addBusinessContext('cache_set_error', error.message);
      LogHelpers.addBusinessContext('cache_user_id', userId);
      LogHelpers.addBusinessContext('cache_tier', subscription.tier);
    }
  }

  public async invalidateCache(userId: string): Promise<void> {
    try {
      await this.cacheManager.del(this.getCacheKey(userId));
    } catch (error) {
      LogHelpers.addBusinessContext('cache_del_error', error.message);
      LogHelpers.addBusinessContext('cache_user_id', userId);
    }
  }

  private getCurrentMonthPeriod(): { start: Date; end: Date } {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    return { start, end };
  }

  private getTierFromPriceId(priceId: string | undefined): SubscriptionTier {
    if (!priceId) {
      return SUBSCRIPTION_TIERS.FREE;
    }

    const monthlyPriceId = this.configService.get<string>(
      'STRIPE_MONTHLY_PRICE_ID',
    );
    const yearlyPriceId = this.configService.get<string>(
      'STRIPE_YEARLY_PRICE_ID',
    );

    if (priceId === monthlyPriceId) {
      return SUBSCRIPTION_TIERS.MONTHLY;
    }

    if (priceId === yearlyPriceId) {
      return SUBSCRIPTION_TIERS.YEARLY;
    }

    return SUBSCRIPTION_TIERS.FREE;
  }

  private clearStripeCustomer(subscription: Subscription): void {
    subscription.stripeCustomerId = null;
  }

  private isActiveSubscription(subscription: Subscription): boolean {
    const hasPaidTier =
      subscription.tier === SUBSCRIPTION_TIERS.MONTHLY ||
      subscription.tier === SUBSCRIPTION_TIERS.YEARLY ||
      subscription.tier === SUBSCRIPTION_TIERS.LIFETIME;

    if (!hasPaidTier) {
      return false;
    }

    if (subscription.tier === SUBSCRIPTION_TIERS.LIFETIME) {
      return true;
    }

    return (
      subscription.status === SUBSCRIPTION_STATUSES.ACTIVE ||
      subscription.status === SUBSCRIPTION_STATUSES.TRIALING
    );
  }

  public async getOrCreateSubscription(userId: string): Promise<Subscription> {
    const cached = await this.getCachedSubscription(userId);

    if (cached) {
      LogHelpers.addBusinessContext('subscription_tier', cached.tier);
      return cached;
    }

    let subscription = await LogHelpers.withDatabaseTelemetry(() =>
      this.subscriptionRepo.findOne({
        where: { userId },
      }),
    );

    if (!subscription) {
      LogHelpers.addBusinessContext('subscription_created', true);

      const newSubscription = this.subscriptionRepo.create({
        userId,
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      });

      subscription = await LogHelpers.withDatabaseTelemetry(() =>
        this.subscriptionRepo.save(newSubscription),
      );
    }

    await this.cacheSubscription(userId, subscription);
    LogHelpers.addBusinessContext('subscription_tier', subscription.tier);

    return subscription;
  }

  public async createCheckoutSession(
    userId: string,
    email: string,
    name: string,
    tier: PurchasableTier,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    LogHelpers.addBusinessContext('checkout_operation', 'create_checkout');
    LogHelpers.addBusinessContext('checkout_tier', tier);
    LogHelpers.addBusinessContext('checkout_user_id', userId);
    LogHelpers.addBusinessContext('checkout_user_email', email);

    try {
      const subscription = await this.getOrCreateSubscription(userId);
      LogHelpers.addBusinessContext('existing_tier', subscription.tier);

      let customerId: string | null = subscription.stripeCustomerId;

      if (customerId) {
        LogHelpers.addBusinessContext('existing_customer_id', customerId);

        try {
          const customer = await this.stripeService.getCustomer(customerId);

          if ('deleted' in customer && customer.deleted) {
            LogHelpers.addBusinessContext('stripe_customer_deleted', true);
            customerId = null;
            this.clearStripeCustomer(subscription);
          }
        } catch (error) {
          LogHelpers.addBusinessContext('customer_lookup_error', error.message);
          LogHelpers.addBusinessContext('customer_error_code', error.code);

          if (error.code === 'resource_missing') {
            LogHelpers.addBusinessContext('stripe_customer_missing', true);
            customerId = null;
            this.clearStripeCustomer(subscription);
          } else {
            throw new HttpException(
              `Failed to verify Stripe customer: ${error.message}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        }
      }

      if (!customerId) {
        LogHelpers.addBusinessContext('creating_new_customer', true);

        try {
          const customer = await this.stripeService.createCustomer(
            userId,
            email,
            name,
          );

          customerId = customer.id;
          subscription.stripeCustomerId = customerId;

          await LogHelpers.withDatabaseTelemetry(() =>
            this.subscriptionRepo.save(subscription),
          );

          await this.invalidateCache(userId);

          LogHelpers.addBusinessContext('stripe_customer_created', true);
          LogHelpers.addBusinessContext('new_customer_id', customerId);
        } catch (error) {
          LogHelpers.addBusinessContext(
            'customer_creation_error',
            error.message,
          );

          throw new HttpException(
            `Failed to create Stripe customer: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      const priceId =
        tier === 'monthly'
          ? this.configService.get<string>('STRIPE_MONTHLY_PRICE_ID')
          : this.configService.get<string>('STRIPE_YEARLY_PRICE_ID');

      if (!priceId) {
        LogHelpers.addBusinessContext('price_id_missing', true);
        LogHelpers.addBusinessContext('requested_tier', tier);

        throw new HttpException(
          `Price ID not configured for tier: ${tier}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      LogHelpers.addBusinessContext('price_id', priceId);

      try {
        const session = await this.stripeService.createCheckoutSession(
          customerId,
          priceId,
          userId,
          successUrl,
          cancelUrl,
        );

        if (!session.url) {
          LogHelpers.addBusinessContext('checkout_missing_url', true);
          LogHelpers.addBusinessContext('session_id', session.id);

          throw new HttpException(
            'Checkout session created but missing URL',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        LogHelpers.addBusinessContext('checkout_session_created', true);
        LogHelpers.addBusinessContext('session_id', session.id);

        return { url: session.url };
      } catch (error) {
        LogHelpers.addBusinessContext('checkout_creation_error', error.message);
        LogHelpers.addBusinessContext('customer_id', customerId);

        throw new HttpException(
          `Failed to create checkout session: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      LogHelpers.addBusinessContext('checkout_unexpected_error', error.message);

      throw new HttpException(
        `Unexpected error during checkout: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    LogHelpers.addBusinessContext('portal_operation', 'create_portal');
    LogHelpers.addBusinessContext('portal_user_id', userId);

    try {
      const subscription = await LogHelpers.withDatabaseTelemetry(() =>
        this.subscriptionRepo.findOne({
          where: { userId },
        }),
      );

      if (!subscription) {
        LogHelpers.addBusinessContext('portal_session_failed', true);
        LogHelpers.addBusinessContext('reason', 'no_subscription_record');

        throw new HttpException(
          'No subscription record found for user',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!subscription.stripeCustomerId) {
        LogHelpers.addBusinessContext('portal_session_failed', true);
        LogHelpers.addBusinessContext('reason', 'no_stripe_customer');
        LogHelpers.addBusinessContext('subscription_tier', subscription.tier);

        throw new HttpException(
          'No Stripe customer associated with subscription',
          HttpStatus.NOT_FOUND,
        );
      }

      LogHelpers.addBusinessContext(
        'customer_id',
        subscription.stripeCustomerId,
      );

      try {
        const session = await this.stripeService.createPortalSession(
          subscription.stripeCustomerId,
          returnUrl,
        );

        if (!session.url) {
          LogHelpers.addBusinessContext('portal_missing_url', true);

          throw new HttpException(
            'Portal session created but missing URL',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        LogHelpers.addBusinessContext('portal_session_created', true);

        return { url: session.url };
      } catch (error) {
        LogHelpers.addBusinessContext('portal_creation_error', error.message);

        throw new HttpException(
          `Failed to create portal session: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      LogHelpers.addBusinessContext('portal_unexpected_error', error.message);

      throw new HttpException(
        `Unexpected error creating portal session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async handleSubscriptionUpdate(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    LogHelpers.addBusinessContext('webhook_operation', 'subscription_update');
    LogHelpers.addBusinessContext(
      'stripe_subscription_id',
      stripeSubscription.id,
    );
    LogHelpers.addBusinessContext('stripe_status', stripeSubscription.status);

    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      LogHelpers.addBusinessContext('webhook_error', 'missing_user_id');
      LogHelpers.addBusinessContext(
        'subscription_metadata',
        JSON.stringify(stripeSubscription.metadata),
      );

      throw new Error('Webhook missing userId in subscription metadata');
    }

    LogHelpers.addBusinessContext('webhook_user_id', userId);

    try {
      const subscription = await this.getOrCreateSubscription(userId);
      LogHelpers.addBusinessContext('previous_tier', subscription.tier);
      LogHelpers.addBusinessContext('previous_status', subscription.status);

      const priceId = stripeSubscription.items.data[0]?.price.id;

      if (!priceId) {
        LogHelpers.addBusinessContext('webhook_error', 'missing_price_id');
        LogHelpers.addBusinessContext(
          'items_count',
          stripeSubscription.items.data.length,
        );

        throw new Error('Subscription missing price ID');
      }

      LogHelpers.addBusinessContext('stripe_price_id', priceId);

      const tier = this.getTierFromPriceId(priceId);

      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.tier = tier;
      subscription.status = stripeSubscription.status as SubscriptionStatus;
      subscription.currentPeriodStart = new Date(
        stripeSubscription.current_period_start * 1000,
      );
      subscription.currentPeriodEnd = new Date(
        stripeSubscription.current_period_end * 1000,
      );
      subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

      await LogHelpers.withDatabaseTelemetry(() =>
        this.subscriptionRepo.save(subscription),
      );

      await this.invalidateCache(userId);

      LogHelpers.addBusinessContext('subscription_updated', true);
      LogHelpers.addBusinessContext('new_tier', tier);
      LogHelpers.addBusinessContext('new_status', subscription.status);
      LogHelpers.addBusinessContext(
        'cancel_at_period_end',
        subscription.cancelAtPeriodEnd,
      );
    } catch (error) {
      LogHelpers.addBusinessContext('subscription_update_error', error.message);

      throw error;
    }
  }

  public async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    LogHelpers.addBusinessContext('webhook_operation', 'subscription_deleted');
    LogHelpers.addBusinessContext(
      'stripe_subscription_id',
      stripeSubscription.id,
    );

    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      LogHelpers.addBusinessContext('webhook_error', 'missing_user_id');
      LogHelpers.addBusinessContext(
        'subscription_metadata',
        JSON.stringify(stripeSubscription.metadata),
      );

      throw new Error('Webhook missing userId in subscription metadata');
    }

    LogHelpers.addBusinessContext('webhook_user_id', userId);

    try {
      const subscription = await LogHelpers.withDatabaseTelemetry(() =>
        this.subscriptionRepo.findOne({
          where: { userId },
        }),
      );

      if (!subscription) {
        LogHelpers.addBusinessContext(
          'webhook_error',
          'subscription_not_found',
        );
        LogHelpers.addBusinessContext('user_id', userId);

        throw new Error(
          `No subscription found for user ${userId} during deletion`,
        );
      }

      LogHelpers.addBusinessContext('previous_tier', subscription.tier);
      LogHelpers.addBusinessContext('previous_status', subscription.status);

      subscription.tier = SUBSCRIPTION_TIERS.FREE;
      subscription.status = SUBSCRIPTION_STATUSES.CANCELED;
      subscription.canceledAt = new Date();

      await LogHelpers.withDatabaseTelemetry(() =>
        this.subscriptionRepo.save(subscription),
      );

      await this.invalidateCache(userId);

      LogHelpers.addBusinessContext('subscription_canceled', true);
    } catch (error) {
      LogHelpers.addBusinessContext('subscription_delete_error', error.message);

      throw error;
    }
  }

  public async checkFeatureAccess(
    userId: string,
    feature: string,
  ): Promise<FeatureAccessResult> {
    const subscription = await this.getOrCreateSubscription(userId);

    const isPro = this.isActiveSubscription(subscription);

    LogHelpers.addBusinessContext('feature_check', feature);
    LogHelpers.addBusinessContext('is_pro', isPro);

    if (feature.startsWith('ai_')) {
      return { allowed: isPro };
    }

    if (feature === 'entry_creation') {
      if (isPro) {
        return { allowed: true };
      }

      const { start: periodStart } = this.getCurrentMonthPeriod();

      const usage = await LogHelpers.withDatabaseTelemetry(() =>
        this.usageRepo.findOne({
          where: {
            userId,
            featureName: 'entry_creation',
            periodStart,
          },
        }),
      );

      const usageCount = usage?.usageCount || 0;
      const limit = this.FREE_TIER_ENTRY_LIMIT;

      LogHelpers.addBusinessContext('entry_usage', usageCount);
      LogHelpers.addBusinessContext('entry_limit', limit);

      return { allowed: usageCount < limit, limit, usage: usageCount };
    }

    return { allowed: true };
  }

  public async incrementUsage(userId: string, feature: string): Promise<void> {
    LogHelpers.addBusinessContext('usage_operation', 'increment');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('feature', feature);

    const { start: periodStart, end: periodEnd } = this.getCurrentMonthPeriod();

    try {
      const existingUsage = await LogHelpers.withDatabaseTelemetry(() =>
        this.usageRepo.findOne({
          where: {
            userId,
            featureName: feature,
            periodStart,
          },
        }),
      );

      if (existingUsage) {
        existingUsage.usageCount += 1;
        existingUsage.lastUpdated = new Date();

        await LogHelpers.withDatabaseTelemetry(() =>
          this.usageRepo.save(existingUsage),
        );

        LogHelpers.addBusinessContext('usage_incremented', true);
        LogHelpers.addBusinessContext(
          'new_usage_count',
          existingUsage.usageCount,
        );
      } else {
        const newUsage = this.usageRepo.create({
          userId,
          featureName: feature,
          usageCount: 1,
          periodStart,
          periodEnd,
        });

        await LogHelpers.withDatabaseTelemetry(() =>
          this.usageRepo.save(newUsage),
        );

        LogHelpers.addBusinessContext('usage_created', true);
        LogHelpers.addBusinessContext('new_usage_count', 1);
      }
    } catch (error) {
      LogHelpers.addBusinessContext('usage_increment_error', error.message);

      throw error;
    }
  }
}
