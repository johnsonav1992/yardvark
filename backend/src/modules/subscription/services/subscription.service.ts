import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../models/subscription.model';
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
  SubscriptionTier,
  SubscriptionStatus,
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
      return cached.data;
    }

    if (cached) {
      this.subscriptionCache.delete(userId);
    }

    return null;
  }

  private cacheSubscription(userId: string, subscription: Subscription): void {
    this.subscriptionCache.set(userId, {
      data: subscription,
      timestamp: Date.now(),
    });
  }

  invalidateCache(userId: string): void {
    this.subscriptionCache.delete(userId);
  }

  async getOrCreateSubscription(userId: string): Promise<Subscription> {
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

  async createCheckoutSession(
    userId: string,
    email: string,
    name: string,
    tier: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    LogHelpers.addBusinessContext('checkout_tier', tier);

    const subscription = await this.getOrCreateSubscription(userId);

    let customerId = subscription.stripeCustomerId;

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

  async createPortalSession(
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

  async handleSubscriptionUpdate(
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
    const monthlyPriceId = this.configService.get<string>(
      'STRIPE_MONTHLY_PRICE_ID',
    );
    const yearlyPriceId = this.configService.get<string>(
      'STRIPE_YEARLY_PRICE_ID',
    );

    let tier: SubscriptionTier = SUBSCRIPTION_TIERS.FREE;

    if (priceId === monthlyPriceId) {
      tier = SUBSCRIPTION_TIERS.MONTHLY;
    }

    if (priceId === yearlyPriceId) {
      tier = SUBSCRIPTION_TIERS.YEARLY;
    }

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

  async handleSubscriptionDeleted(
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

  async checkFeatureAccess(
    userId: string,
    feature: string,
  ): Promise<FeatureAccessResult> {
    const subscription = await this.getOrCreateSubscription(userId);

    const isPro =
      subscription.tier === SUBSCRIPTION_TIERS.MONTHLY ||
      subscription.tier === SUBSCRIPTION_TIERS.YEARLY ||
      subscription.tier === SUBSCRIPTION_TIERS.LIFETIME;

    LogHelpers.addBusinessContext('feature_check', feature);
    LogHelpers.addBusinessContext('is_pro', isPro);

    if (feature.startsWith('ai_')) {
      return { allowed: isPro };
    }

    if (feature === 'entry_creation') {
      if (isPro) {
        return { allowed: true };
      }

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const usage = await LogHelpers.withDatabaseTelemetry(() =>
        this.usageRepo.findOne({
          where: {
            userId,
            featureName: 'entry_creation',
            periodStart: currentMonth,
          },
        }),
      );

      const usageCount = usage?.usageCount || 0;
      const limit = 6;

      LogHelpers.addBusinessContext('entry_usage', usageCount);
      LogHelpers.addBusinessContext('entry_limit', limit);

      return { allowed: usageCount < limit, limit, usage: usageCount };
    }

    return { allowed: true };
  }

  async incrementUsage(userId: string, feature: string): Promise<void> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    let usage = await LogHelpers.withDatabaseTelemetry(() =>
      this.usageRepo.findOne({
        where: { userId, featureName: feature, periodStart: currentMonth },
      }),
    );

    if (!usage) {
      usage = this.usageRepo.create({
        userId,
        featureName: feature,
        usageCount: 1,
        periodStart: currentMonth,
        periodEnd: nextMonth,
      });
    } else {
      usage.usageCount += 1;
    }

    await LogHelpers.withDatabaseTelemetry(() => this.usageRepo.save(usage));

    LogHelpers.addBusinessContext('usage_incremented', true);
    LogHelpers.addBusinessContext('feature', feature);
    LogHelpers.addBusinessContext('new_usage_count', usage.usageCount);
  }
}
