import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
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

export type FeatureAccessResult = {
  allowed: boolean;
  limit?: number;
  usage?: number;
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(FeatureUsage)
    private usageRepo: Repository<FeatureUsage>,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    if (!subscription) {
      this.logger.log(`Creating new free subscription for user ${userId}`);

      subscription = this.subscriptionRepo.create({
        userId,
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      });

      await this.subscriptionRepo.save(subscription);
    }

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
    this.logger.log(`Creating checkout for user ${userId}, tier: ${tier}`);

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
      await this.subscriptionRepo.save(subscription);
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

    return { url: session.url };
  }

  async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
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

    return { url: session.url };
  }

  async handleSubscriptionUpdate(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      this.logger.error('No userId in subscription metadata');
      return;
    }

    this.logger.log(`Updating subscription for user ${userId}`);

    const subscription = await this.getOrCreateSubscription(userId);

    const priceId = stripeSubscription.items.data[0]?.price.id;
    const monthlyPriceId =
      this.configService.get<string>('STRIPE_MONTHLY_PRICE_ID');
    const yearlyPriceId =
      this.configService.get<string>('STRIPE_YEARLY_PRICE_ID');

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

    await this.subscriptionRepo.save(subscription);

    this.logger.log(
      `Subscription updated for user ${userId}: ${tier} (${subscription.status})`,
    );
  }

  async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      this.logger.error('No userId in subscription metadata');
      return;
    }

    this.logger.log(`Deleting subscription for user ${userId}`);

    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
    });

    if (subscription) {
      subscription.tier = SUBSCRIPTION_TIERS.FREE;
      subscription.status = SUBSCRIPTION_STATUSES.CANCELED;
      subscription.canceledAt = new Date();

      await this.subscriptionRepo.save(subscription);

      this.logger.log(`Subscription canceled for user ${userId}`);
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

      const usage = await this.usageRepo.findOne({
        where: {
          userId,
          featureName: 'entry_creation',
          periodStart: currentMonth,
        },
      });

      const usageCount = usage?.usageCount || 0;
      const limit = 6;

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

    let usage = await this.usageRepo.findOne({
      where: { userId, featureName: feature, periodStart: currentMonth },
    });

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

    await this.usageRepo.save(usage);

    this.logger.log(
      `Incremented ${feature} usage for user ${userId}: ${usage.usageCount}`,
    );
  }
}
