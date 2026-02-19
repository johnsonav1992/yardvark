import { Injectable, Inject } from '@nestjs/common';
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
  PricingResponse,
} from '../models/subscription.types';
import { FeatureUsage } from '../models/usage.model';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LogHelpers } from '../../../logger/logger.helpers';
import { Either, error, success } from '../../../types/either';
import { ResourceError } from '../../../errors/resource-error';
import {
  StripeCustomerVerificationError,
  StripeCustomerCreationError,
  PriceIdNotConfigured,
  CheckoutSessionCreationError,
  CheckoutUrlMissing,
  SubscriptionNotFound,
  StripeCustomerNotFound,
  PortalSessionCreationError,
  PortalUrlMissing,
  MissingUserId,
  MissingPriceId,
  SubscriptionUpdateError,
  SubscriptionFetchError,
  FeatureAccessError,
  PricingFetchError,
} from '../models/subscription.errors';
import { startOfMonth, addMonths, startOfDay } from 'date-fns';

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
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(FeatureUsage)
    private readonly usageRepo: Repository<FeatureUsage>,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    const now = new Date();
    const start = startOfDay(startOfMonth(now));
    const end = addMonths(start, 1);

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

  public async getOrCreateSubscription(
    userId: string,
  ): Promise<Either<SubscriptionFetchError, Subscription>> {
    const cached = await this.getCachedSubscription(userId);

    if (cached) {
      LogHelpers.addBusinessContext('subscription_tier', cached.tier);

      return success(cached);
    }

    try {
      let subscription = await this.subscriptionRepo.findOne({
        where: { userId },
      });

      if (!subscription) {
        LogHelpers.addBusinessContext('subscription_created', true);

        const newSubscription = this.subscriptionRepo.create({
          userId,
          tier: SUBSCRIPTION_TIERS.FREE,
          status: SUBSCRIPTION_STATUSES.ACTIVE,
        });

        subscription = await this.subscriptionRepo.save(newSubscription);
      }

      await this.cacheSubscription(userId, subscription);
      LogHelpers.addBusinessContext('subscription_tier', subscription.tier);

      return success(subscription);
    } catch (err) {
      LogHelpers.addBusinessContext(
        'subscription_fetch_error',
        (err as Error).message,
      );

      return error(new SubscriptionFetchError(err));
    }
  }

  public async createCheckoutSession(
    userId: string,
    email: string,
    name: string,
    tier: PurchasableTier,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Either<ResourceError, { url: string }>> {
    LogHelpers.addBusinessContext('checkout_operation', 'create_checkout');
    LogHelpers.addBusinessContext('checkout_tier', tier);
    LogHelpers.addBusinessContext('checkout_user_id', userId);
    LogHelpers.addBusinessContext('checkout_user_email', email);

    const subscriptionResult = await this.getOrCreateSubscription(userId);

    if (subscriptionResult.isError()) return error(subscriptionResult.value);

    const subscription = subscriptionResult.value;
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
      } catch (err) {
        LogHelpers.addBusinessContext('customer_lookup_error', err.message);
        LogHelpers.addBusinessContext('customer_error_code', err.code);

        if (err.code === 'resource_missing') {
          LogHelpers.addBusinessContext('stripe_customer_missing', true);
          customerId = null;
          this.clearStripeCustomer(subscription);
        } else {
          return error(new StripeCustomerVerificationError(err));
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

        await this.subscriptionRepo.save(subscription);

        await this.invalidateCache(userId);

        LogHelpers.addBusinessContext('stripe_customer_created', true);
        LogHelpers.addBusinessContext('new_customer_id', customerId);
      } catch (err) {
        LogHelpers.addBusinessContext('customer_creation_error', err.message);

        return error(new StripeCustomerCreationError(err));
      }
    }

    const priceId =
      tier === 'monthly'
        ? this.configService.get<string>('STRIPE_MONTHLY_PRICE_ID')
        : this.configService.get<string>('STRIPE_YEARLY_PRICE_ID');

    if (!priceId) {
      LogHelpers.addBusinessContext('price_id_missing', true);
      LogHelpers.addBusinessContext('requested_tier', tier);

      return error(new PriceIdNotConfigured(tier));
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

        return error(new CheckoutUrlMissing());
      }

      LogHelpers.addBusinessContext('checkout_session_created', true);
      LogHelpers.addBusinessContext('session_id', session.id);

      return success({ url: session.url });
    } catch (err) {
      LogHelpers.addBusinessContext('checkout_creation_error', err.message);
      LogHelpers.addBusinessContext('customer_id', customerId);

      return error(new CheckoutSessionCreationError(err));
    }
  }

  public async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<Either<ResourceError, { url: string }>> {
    LogHelpers.addBusinessContext('portal_operation', 'create_portal');
    LogHelpers.addBusinessContext('portal_user_id', userId);

    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    if (!subscription) {
      LogHelpers.addBusinessContext('portal_session_failed', true);
      LogHelpers.addBusinessContext('reason', 'no_subscription_record');

      return error(new SubscriptionNotFound());
    }

    if (!subscription.stripeCustomerId) {
      LogHelpers.addBusinessContext('portal_session_failed', true);
      LogHelpers.addBusinessContext('reason', 'no_stripe_customer');
      LogHelpers.addBusinessContext('subscription_tier', subscription.tier);

      return error(new StripeCustomerNotFound());
    }

    LogHelpers.addBusinessContext('customer_id', subscription.stripeCustomerId);

    try {
      const session = await this.stripeService.createPortalSession(
        subscription.stripeCustomerId,
        returnUrl,
      );

      if (!session.url) {
        LogHelpers.addBusinessContext('portal_missing_url', true);

        return error(new PortalUrlMissing());
      }

      LogHelpers.addBusinessContext('portal_session_created', true);

      return success({ url: session.url });
    } catch (err) {
      LogHelpers.addBusinessContext('portal_creation_error', err.message);

      return error(new PortalSessionCreationError(err));
    }
  }

  public async handleSubscriptionUpdate(
    stripeSubscription: Stripe.Subscription,
  ): Promise<Either<ResourceError, void>> {
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

      return error(new MissingUserId());
    }

    LogHelpers.addBusinessContext('webhook_user_id', userId);

    const subscriptionResult = await this.getOrCreateSubscription(userId);

    if (subscriptionResult.isError()) return error(subscriptionResult.value);

    const subscription = subscriptionResult.value;

    try {
      LogHelpers.addBusinessContext('previous_tier', subscription.tier);
      LogHelpers.addBusinessContext('previous_status', subscription.status);

      const priceId = stripeSubscription.items.data[0]?.price.id;

      if (!priceId) {
        LogHelpers.addBusinessContext('webhook_error', 'missing_price_id');
        LogHelpers.addBusinessContext(
          'items_count',
          stripeSubscription.items.data.length,
        );

        return error(new MissingPriceId());
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

      await this.subscriptionRepo.save(subscription);

      await this.invalidateCache(userId);

      LogHelpers.addBusinessContext('subscription_updated', true);
      LogHelpers.addBusinessContext('new_tier', tier);
      LogHelpers.addBusinessContext('new_status', subscription.status);
      LogHelpers.addBusinessContext(
        'cancel_at_period_end',
        subscription.cancelAtPeriodEnd,
      );

      return success(undefined);
    } catch (err) {
      LogHelpers.addBusinessContext('subscription_update_error', err.message);

      return error(new SubscriptionUpdateError(err));
    }
  }

  public async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<Either<ResourceError, void>> {
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

      return error(new MissingUserId());
    }

    LogHelpers.addBusinessContext('webhook_user_id', userId);

    try {
      const subscription = await this.subscriptionRepo.findOne({
        where: { userId },
      });

      if (!subscription) {
        LogHelpers.addBusinessContext(
          'webhook_error',
          'subscription_not_found',
        );
        LogHelpers.addBusinessContext('user_id', userId);

        return error(new SubscriptionNotFound());
      }

      LogHelpers.addBusinessContext('previous_tier', subscription.tier);
      LogHelpers.addBusinessContext('previous_status', subscription.status);

      subscription.tier = SUBSCRIPTION_TIERS.FREE;
      subscription.status = SUBSCRIPTION_STATUSES.CANCELED;
      subscription.canceledAt = startOfDay(new Date());

      await this.subscriptionRepo.save(subscription);

      await this.invalidateCache(userId);

      LogHelpers.addBusinessContext('subscription_canceled', true);

      return success(undefined);
    } catch (err) {
      LogHelpers.addBusinessContext('subscription_delete_error', err.message);

      return error(new SubscriptionUpdateError(err));
    }
  }

  public async checkFeatureAccess(
    userId: string,
    feature: string,
  ): Promise<Either<FeatureAccessError, FeatureAccessResult>> {
    try {
      const subscriptionResult = await this.getOrCreateSubscription(userId);

      if (subscriptionResult.isError()) {
        return error(new FeatureAccessError(subscriptionResult.value.error));
      }

      const subscription = subscriptionResult.value;
      const isPro = this.isActiveSubscription(subscription);

      LogHelpers.addBusinessContext('feature_check', feature);
      LogHelpers.addBusinessContext('is_pro', isPro);

      if (feature.startsWith('ai_')) {
        return success({ allowed: isPro });
      }

      if (feature === 'entry_creation') {
        if (isPro) {
          return success({ allowed: true });
        }

        const { start: periodStart } = this.getCurrentMonthPeriod();

        const usage = await this.usageRepo.findOne({
          where: {
            userId,
            featureName: 'entry_creation',
            periodStart,
          },
        });

        const usageCount = usage?.usageCount || 0;
        const limit = this.FREE_TIER_ENTRY_LIMIT;

        LogHelpers.addBusinessContext('entry_usage', usageCount);
        LogHelpers.addBusinessContext('entry_limit', limit);

        return success({
          allowed: usageCount < limit,
          limit,
          usage: usageCount,
        });
      }

      return success({ allowed: true });
    } catch (err) {
      LogHelpers.addBusinessContext(
        'feature_access_error',
        (err as Error).message,
      );

      return error(new FeatureAccessError(err));
    }
  }

  public async getPricing(): Promise<
    Either<PricingFetchError, PricingResponse>
  > {
    const cacheKey = 'subscription:pricing';

    try {
      const cached = await this.cacheManager.get<PricingResponse>(cacheKey);

      if (cached) {
        LogHelpers.addBusinessContext('pricing_cache_hit', true);

        return success(cached);
      }

      const monthlyPriceId = this.configService.get<string>(
        'STRIPE_MONTHLY_PRICE_ID',
      );
      const yearlyPriceId = this.configService.get<string>(
        'STRIPE_YEARLY_PRICE_ID',
      );

      if (!monthlyPriceId || !yearlyPriceId) {
        return error(new PricingFetchError());
      }

      const stripe = this.stripeService.getStripe();

      const [monthlyPrice, yearlyPrice] = await Promise.all([
        stripe.prices.retrieve(monthlyPriceId),
        stripe.prices.retrieve(yearlyPriceId),
      ]);

      const response: PricingResponse = {
        prices: [
          {
            tier: SUBSCRIPTION_TIERS.MONTHLY,
            amount: (monthlyPrice.unit_amount || 0) / 100,
            currency: monthlyPrice.currency,
            interval: 'month',
          },
          {
            tier: SUBSCRIPTION_TIERS.YEARLY,
            amount: (yearlyPrice.unit_amount || 0) / 100,
            currency: yearlyPrice.currency,
            interval: 'year',
          },
        ],
      };

      await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000);

      LogHelpers.addBusinessContext('pricing_fetched', true);

      return success(response);
    } catch (err) {
      LogHelpers.addBusinessContext('pricing_fetch_error', (err as Error).message);

      return error(new PricingFetchError(err));
    }
  }

  public async incrementUsage(
    userId: string,
    feature: string,
  ): Promise<Either<ResourceError, void>> {
    LogHelpers.addBusinessContext('usage_operation', 'increment');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('feature', feature);

    const { start: periodStart, end: periodEnd } = this.getCurrentMonthPeriod();

    try {
      const existingUsage = await this.usageRepo.findOne({
        where: {
          userId,
          featureName: feature,
          periodStart,
        },
      });

      if (existingUsage) {
        existingUsage.usageCount += 1;
        existingUsage.lastUpdated = startOfDay(new Date());

        await this.usageRepo.save(existingUsage);

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

        await this.usageRepo.save(newUsage);

        LogHelpers.addBusinessContext('usage_created', true);
        LogHelpers.addBusinessContext('new_usage_count', 1);
      }

      return success(undefined);
    } catch (err) {
      LogHelpers.addBusinessContext('usage_increment_error', err.message);

      return error(
        new ResourceError({
          message: `Failed to increment usage: ${err.message}`,
          code: 'USAGE_INCREMENT_ERROR',
          statusCode: 500,
          error: err,
        }),
      );
    }
  }

  public async incrementUsageBatch(
    userId: string,
    feature: string,
    count: number,
  ): Promise<Either<ResourceError, void>> {
    LogHelpers.addBusinessContext('usage_operation', 'increment_batch');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('feature', feature);
    LogHelpers.addBusinessContext('count', count);

    if (count <= 0) {
      return success(undefined);
    }

    const { start: periodStart, end: periodEnd } = this.getCurrentMonthPeriod();

    try {
      const existingUsage = await this.usageRepo.findOne({
        where: {
          userId,
          featureName: feature,
          periodStart,
        },
      });

      if (existingUsage) {
        existingUsage.usageCount += count;
        existingUsage.lastUpdated = startOfDay(new Date());

        await this.usageRepo.save(existingUsage);

        LogHelpers.addBusinessContext('usage_incremented', true);
        LogHelpers.addBusinessContext(
          'new_usage_count',
          existingUsage.usageCount,
        );
      } else {
        const newUsage = this.usageRepo.create({
          userId,
          featureName: feature,
          usageCount: count,
          periodStart,
          periodEnd,
        });

        await this.usageRepo.save(newUsage);

        LogHelpers.addBusinessContext('usage_created', true);
        LogHelpers.addBusinessContext('new_usage_count', count);
      }

      return success(undefined);
    } catch (err) {
      LogHelpers.addBusinessContext('usage_increment_error', err.message);

      return error(
        new ResourceError({
          message: `Failed to increment batch usage: ${err.message}`,
          code: 'USAGE_INCREMENT_BATCH_ERROR',
          statusCode: 500,
          error: err,
        }),
      );
    }
  }
}
