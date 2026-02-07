import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

type CachedSubscription = {
  data: Subscription;
  timestamp: number;
};

@Injectable()
export class SubscriptionService {
  private subscriptionCache = new Map<string, CachedSubscription>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  private readonly CACHE_MAX_SIZE = 1000;
  private readonly FREE_TIER_ENTRY_LIMIT = 6;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(FeatureUsage)
    private usageRepo: Repository<FeatureUsage>,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  private isCacheValid(cached: CachedSubscription | undefined): boolean {
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL_MS;
  }

  private getCachedSubscription(userId: string): Subscription | null {
    const cached = this.subscriptionCache.get(userId);

    if (cached && this.isCacheValid(cached)) {
      LogHelpers.addBusinessContext('subscription_cache_hit', true);
      this.subscriptionCache.delete(userId);
      this.subscriptionCache.set(userId, cached);
      return cached.data;
    }

    if (cached) {
      this.subscriptionCache.delete(userId);
    }

    return null;
  }

  private cacheSubscription(userId: string, subscription: Subscription): void {
    if (this.subscriptionCache.size >= this.CACHE_MAX_SIZE) {
      const firstKey = this.subscriptionCache.keys().next().value;

      if (firstKey) {
        this.subscriptionCache.delete(firstKey);
        LogHelpers.addBusinessContext('subscription_cache_evicted', true);
      }
    }

    this.subscriptionCache.set(userId, {
      data: subscription,
      timestamp: Date.now(),
    });
  }

  public invalidateCache(userId: string): void {
    this.subscriptionCache.delete(userId);
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
    const cached = this.getCachedSubscription(userId);

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

    this.cacheSubscription(userId, subscription);
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
    LogHelpers.addBusinessContext('checkout_tier', tier);

    const subscription = await this.getOrCreateSubscription(userId);

    let customerId: string | null = subscription.stripeCustomerId;

    if (customerId) {
      try {
        const customer = await this.stripeService.getCustomer(customerId);

        if ('deleted' in customer && customer.deleted) {
          LogHelpers.addBusinessContext('stripe_customer_deleted', true);
          customerId = null;
          this.clearStripeCustomer(subscription);
        }
      } catch (error) {
        if (error.code === 'resource_missing') {
          LogHelpers.addBusinessContext('stripe_customer_missing', true);
          customerId = null;
          this.clearStripeCustomer(subscription);
        } else {
          throw error;
        }
      }
    }

    if (!customerId) {
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

      this.invalidateCache(userId);

      LogHelpers.addBusinessContext('stripe_customer_created', true);
    }

    const priceId =
      tier === 'monthly'
        ? this.configService.get<string>('STRIPE_MONTHLY_PRICE_ID')
        : this.configService.get<string>('STRIPE_YEARLY_PRICE_ID');

    if (!priceId) {
      throw new HttpException(
        `Price ID not configured for tier: ${tier}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const session = await this.stripeService.createCheckoutSession(
      customerId,
      priceId,
      userId,
      successUrl,
      cancelUrl,
    );

    if (!session.url) {
      throw new HttpException(
        'Failed to create checkout session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    LogHelpers.addBusinessContext('checkout_session_created', true);

    return { url: session.url };
  }

  public async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const subscription = await LogHelpers.withDatabaseTelemetry(() =>
      this.subscriptionRepo.findOne({
        where: { userId },
      }),
    );

    if (!subscription?.stripeCustomerId) {
      LogHelpers.addBusinessContext('portal_session_failed', true);
      LogHelpers.addBusinessContext('reason', 'no_subscription');

      throw new HttpException('No subscription found', HttpStatus.NOT_FOUND);
    }

    const session = await this.stripeService.createPortalSession(
      subscription.stripeCustomerId,
      returnUrl,
    );

    if (!session.url) {
      throw new HttpException(
        'Failed to create portal session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    LogHelpers.addBusinessContext('portal_session_created', true);

    return { url: session.url };
  }

  public async handleSubscriptionUpdate(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      LogHelpers.addBusinessContext('webhook_error', 'missing_user_id');

      return;
    }

    LogHelpers.addBusinessContext('webhook_type', 'subscription_update');

    const subscription = await this.getOrCreateSubscription(userId);

    const priceId = stripeSubscription.items.data[0]?.price.id;
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

    this.invalidateCache(userId);

    LogHelpers.addBusinessContext('subscription_updated', true);
    LogHelpers.addBusinessContext('new_tier', tier);
    LogHelpers.addBusinessContext('new_status', subscription.status);
  }

  public async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      LogHelpers.addBusinessContext('webhook_error', 'missing_user_id');

      return;
    }

    LogHelpers.addBusinessContext('webhook_type', 'subscription_deleted');

    const subscription = await LogHelpers.withDatabaseTelemetry(() =>
      this.subscriptionRepo.findOne({
        where: { userId },
      }),
    );

    if (subscription) {
      subscription.tier = SUBSCRIPTION_TIERS.FREE;
      subscription.status = SUBSCRIPTION_STATUSES.CANCELED;
      subscription.canceledAt = new Date();

      await LogHelpers.withDatabaseTelemetry(() =>
        this.subscriptionRepo.save(subscription),
      );

      this.invalidateCache(userId);

      LogHelpers.addBusinessContext('subscription_canceled', true);
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
    const { start: periodStart, end: periodEnd } = this.getCurrentMonthPeriod();

    const result = await LogHelpers.withDatabaseTelemetry(() =>
      this.usageRepo.query(
        `
        INSERT INTO feature_usage (user_id, feature_name, usage_count, period_start, period_end)
        VALUES ($1, $2, 1, $3, $4)
        ON CONFLICT (user_id, feature_name, period_start)
        DO UPDATE SET usage_count = feature_usage.usage_count + 1, last_updated = CURRENT_TIMESTAMP
        RETURNING usage_count
      `,
        [userId, feature, periodStart, periodEnd],
      ),
    );

    const newUsageCount = result[0]?.usage_count;

    LogHelpers.addBusinessContext('usage_incremented', true);
    LogHelpers.addBusinessContext('feature', feature);
    LogHelpers.addBusinessContext('new_usage_count', newUsageCount);
  }
}
