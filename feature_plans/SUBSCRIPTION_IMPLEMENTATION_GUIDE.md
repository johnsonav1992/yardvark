# Yardvark Subscription Feature - Complete Implementation Guide

## Overview

This guide provides step-by-step instructions with complete code for implementing Stripe subscriptions in Yardvark.

### Requirements

- **Pricing**: $7/month or $60/year
- **Free Tier**: 6 entries/month, no AI features
- **Paid Tier**: Unlimited entries, full AI access
- **Existing Users**: Grandfathered as lifetime pro
- **UI**: Dedicated `/subscription` route
- **Payment**: Stripe Checkout (hosted)

---

## TABLE OF CONTENTS

1. [Prerequisites & Setup](#step-1-prerequisites-setup)
2. [Stripe Dashboard Setup](#step-2-stripe-dashboard-setup)
3. [Backend: Database Models](#step-3-backend-database-models)
4. [Backend: Database Migrations](#step-4-backend-database-migrations)
5. [Backend: Environment Configuration](#step-5-backend-environment-configuration)
6. [Backend: Stripe Service](#step-6-backend-stripe-service)
7. [Backend: Subscription Service](#step-7-backend-subscription-service)
8. [Backend: Controllers](#step-8-backend-controllers)
9. [Backend: Guards & Decorators](#step-9-backend-guards-decorators)
10. [Backend: Module Integration](#step-10-backend-module-integration)
11. [Backend: Feature Gating](#step-11-backend-feature-gating)
12. [Frontend: Types](#step-12-frontend-types)
13. [Frontend: Subscription Service](#step-13-frontend-subscription-service)
14. [Frontend: Subscription Page](#step-14-frontend-subscription-page)
15. [Frontend: Routing & Navigation](#step-15-frontend-routing-navigation)
16. [Frontend: Feature Gating](#step-16-frontend-feature-gating)
17. [Testing](#step-17-testing)
18. [Deployment](#step-18-deployment)
19. [Verification Checklist](#step-19-verification-checklist)

---

## STEP 1: Prerequisites & Setup

### 1.1: Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
```

### 1.2: Install Backend Dependencies

```bash
cd backend
npm install stripe@^14.0.0 --save
```

---

## STEP 2: Stripe Dashboard Setup

### 2.1: Get API Keys

1. Go to https://dashboard.stripe.com/
2. Switch to **Test Mode** (toggle in top right)
3. Navigate to **Developers** → **API keys**
4. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2.2: Create Product and Prices

1. Go to **Products** → **Add product**
2. Name: `Yardvark Pro`
3. Add two prices:
   - **Monthly**: $7.00, recurring monthly
   - **Yearly**: $60.00, recurring yearly
4. Save and copy the Price IDs:
   - Monthly: `price_xxxxxxxxxxxxx`
   - Yearly: `price_yyyyyyyyyyyyy`

### 2.3: Prepare Webhook Secret (will configure later)

You'll add the webhook endpoint after deployment. Keep the Dashboard open for later.

---

## STEP 3: Backend - Database Models

### 3.1: Create Subscription Types

**Create directory**:

```bash
mkdir -p backend/src/modules/subscription/models
```

**File**: `backend/src/modules/subscription/models/subscription.types.ts`

```typescript
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
} as const;

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  INCOMPLETE: "incomplete",
  TRIALING: "trialing",
} as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];
```

### 3.2: Create Subscription Model

**File**: `backend/src/modules/subscription/models/subscription.model.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { SubscriptionTier, SubscriptionStatus } from "./subscription.types";

@Entity("subscriptions")
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", unique: true })
  userId: string;

  @Column({ name: "stripe_customer_id", nullable: true })
  stripeCustomerId: string;

  @Column({ name: "stripe_subscription_id", nullable: true })
  stripeSubscriptionId: string;

  @Column({ default: "free" })
  tier: SubscriptionTier;

  @Column({ default: "active" })
  status: SubscriptionStatus;

  @Column({ name: "current_period_start", type: "timestamptz", nullable: true })
  currentPeriodStart: Date;

  @Column({ name: "current_period_end", type: "timestamptz", nullable: true })
  currentPeriodEnd: Date;

  @Column({ name: "cancel_at_period_end", default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: "canceled_at", type: "timestamptz", nullable: true })
  canceledAt: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
```

### 3.3: Create Usage Model

**File**: `backend/src/modules/subscription/models/usage.model.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("feature_usage")
@Index(["userId", "featureName", "periodStart"], { unique: true })
@Index(["userId"])
@Index(["periodStart", "periodEnd"])
export class FeatureUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ name: "feature_name" })
  featureName: string;

  @Column({ name: "usage_count", default: 0 })
  usageCount: number;

  @Column({ name: "period_start", type: "timestamptz" })
  periodStart: Date;

  @Column({ name: "period_end", type: "timestamptz" })
  periodEnd: Date;

  @CreateDateColumn({ name: "last_updated", type: "timestamptz" })
  lastUpdated: Date;
}
```

---

## STEP 4: Backend - Database Migrations

### 4.1: Generate Migration for Subscription Tables

```bash
cd backend
npm run migration:generate -- src/migrations/AddSubscriptionTables
```

**Edit the generated file** (`backend/src/migrations/[TIMESTAMP]-AddSubscriptionTables.ts`):

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionTables1234567890000 implements MigrationInterface {
  name = "AddSubscriptionTables1234567890000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL UNIQUE,
        stripe_customer_id VARCHAR,
        stripe_subscription_id VARCHAR,
        tier VARCHAR DEFAULT 'free',
        status VARCHAR DEFAULT 'active',
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT false,
        canceled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE feature_usage (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        feature_name VARCHAR NOT NULL,
        usage_count INTEGER DEFAULT 0,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, feature_name, period_start)
      );
    `);

    await queryRunner.query(`CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);`);
    await queryRunner.query(`CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);`);
    await queryRunner.query(`CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);`);
    await queryRunner.query(`CREATE INDEX idx_feature_usage_period ON feature_usage(period_start, period_end);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS feature_usage;`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions;`);
  }
}
```

### 4.2: Generate Migration for Grandfathering Existing Users

```bash
npm run migration:generate -- src/migrations/GrandfatherExistingUsers
```

**Edit the generated file** (`backend/src/migrations/[TIMESTAMP]-GrandfatherExistingUsers.ts`):

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class GrandfatherExistingUsers1234567890001 implements MigrationInterface {
  name = "GrandfatherExistingUsers1234567890001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO subscriptions (user_id, tier, status, created_at, updated_at)
      SELECT DISTINCT
        user_id,
        'lifetime',
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM entries
      WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT user_id FROM subscriptions)
      ON CONFLICT (user_id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
```

### 4.3: Run Migrations Locally

```bash
npm run migration:run
```

Verify:

```bash
psql -h localhost -U your_user -d your_database
\dt
SELECT * FROM subscriptions;
\q
```

---

## STEP 5: Backend - Environment Configuration

### 5.1: Update `.env` File

**File**: `backend/.env`

Add these lines:

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_will_add_after_deployment
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
```

Replace placeholders with your actual keys from Step 2.

---

## STEP 6: Backend - Stripe Service

### 6.1: Create Stripe Service

**Create directory**:

```bash
mkdir -p backend/src/modules/subscription/services
```

**File**: `backend/src/modules/subscription/services/stripe.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { LogHelpers } from "../../../logger/logger.helpers";
import { tryCatch } from "../../../utils/tryCatch";

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
    });

    this.logger.log("Stripe service initialized");
  }

  async createCustomer(userId: string, email: string, name: string): Promise<Stripe.Customer> {
    const start = Date.now();
    const result = await tryCatch(async () => {
      return this.stripe.customers.create({
        email,
        name,
        metadata: { userId },
      });
    });

    LogHelpers.recordExternalCall("stripe", Date.now() - start, result.success);
    LogHelpers.addBusinessContext("stripeOperation", "createCustomer");

    if (result.success) {
      this.logger.log(`Created Stripe customer for user ${userId}`);
      return result.data;
    }

    this.logger.error("Error creating Stripe customer:", result.error);
    throw result.error;
  }

  async createCheckoutSession(customerId: string, priceId: string, userId: string, successUrl: string, cancelUrl: string): Promise<Stripe.Checkout.Session> {
    const start = Date.now();
    const result = await tryCatch(async () => {
      return this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId },
        subscription_data: { metadata: { userId } },
      });
    });

    LogHelpers.recordExternalCall("stripe", Date.now() - start, result.success);
    LogHelpers.addBusinessContext("stripeOperation", "createCheckoutSession");

    if (result.success) {
      this.logger.log(`Created checkout session for customer ${customerId}`);
      return result.data;
    }

    this.logger.error("Error creating checkout session:", result.error);
    throw result.error;
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    const start = Date.now();
    const result = await tryCatch(async () => {
      return this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
    });

    LogHelpers.recordExternalCall("stripe", Date.now() - start, result.success);
    LogHelpers.addBusinessContext("stripeOperation", "createPortalSession");

    if (result.success) {
      this.logger.log(`Created portal session for customer ${customerId}`);
      return result.data;
    }

    this.logger.error("Error creating portal session:", result.error);
    throw result.error;
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const start = Date.now();
    const result = await tryCatch(async () => {
      return this.stripe.subscriptions.retrieve(subscriptionId);
    });

    LogHelpers.recordExternalCall("stripe", Date.now() - start, result.success);

    if (result.success) {
      return result.data;
    }

    this.logger.error("Error retrieving subscription:", result.error);
    throw result.error;
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const start = Date.now();
    const result = await tryCatch(async () => {
      return this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    });

    LogHelpers.recordExternalCall("stripe", Date.now() - start, result.success);
    LogHelpers.addBusinessContext("stripeOperation", "cancelSubscription");

    if (result.success) {
      this.logger.log(`Canceled subscription ${subscriptionId}`);
      return result.data;
    }

    this.logger.error("Error canceling subscription:", result.error);
    throw result.error;
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw err;
    }
  }

  getStripe(): Stripe {
    return this.stripe;
  }
}
```

---

## STEP 7: Backend - Subscription Service

**File**: `backend/src/modules/subscription/services/subscription.service.ts`

```typescript
import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "../models/subscription.model";
import { FeatureUsage } from "../models/usage.model";
import { StripeService } from "./stripe.service";
import { ConfigService } from "@nestjs/config";
import { SUBSCRIPTION_TIERS } from "../models/subscription.types";
import { LogHelpers } from "../../../logger/logger.helpers";
import Stripe from "stripe";

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
    let subscription = await this.subscriptionRepo.findOne({ where: { userId } });

    if (!subscription) {
      this.logger.log(`Creating new free subscription for user ${userId}`);

      subscription = this.subscriptionRepo.create({
        userId,
        tier: SUBSCRIPTION_TIERS.FREE,
        status: "active",
      });

      await this.subscriptionRepo.save(subscription);
      LogHelpers.addBusinessContext("subscriptionCreated", true);
    }

    return subscription;
  }

  async createCheckoutSession(userId: string, email: string, name: string, tier: "monthly" | "yearly", successUrl: string, cancelUrl: string): Promise<{ url: string }> {
    this.logger.log(`Creating checkout for user ${userId}, tier: ${tier}`);
    LogHelpers.addBusinessContext("subscriptionTier", tier);

    const subscription = await this.getOrCreateSubscription(userId);

    let customerId = subscription.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripeService.createCustomer(userId, email, name);
      customerId = customer.id;
      subscription.stripeCustomerId = customerId;
      await this.subscriptionRepo.save(subscription);
    }

    const priceId = tier === "monthly" ? this.configService.get<string>("STRIPE_MONTHLY_PRICE_ID") : this.configService.get<string>("STRIPE_YEARLY_PRICE_ID");

    if (!priceId) {
      throw new HttpException(`Price ID not configured for tier: ${tier}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const session = await this.stripeService.createCheckoutSession(customerId, priceId, userId, successUrl, cancelUrl);

    return { url: session.url };
  }

  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    const subscription = await this.subscriptionRepo.findOne({ where: { userId } });

    if (!subscription?.stripeCustomerId) {
      throw new HttpException("No subscription found", HttpStatus.NOT_FOUND);
    }

    const session = await this.stripeService.createPortalSession(subscription.stripeCustomerId, returnUrl);

    return { url: session.url };
  }

  async handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription): Promise<void> {
    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      this.logger.error("No userId in subscription metadata");
      return;
    }

    this.logger.log(`Updating subscription for user ${userId}`);

    const subscription = await this.getOrCreateSubscription(userId);

    const priceId = stripeSubscription.items.data[0]?.price.id;
    const monthlyPriceId = this.configService.get<string>("STRIPE_MONTHLY_PRICE_ID");
    const yearlyPriceId = this.configService.get<string>("STRIPE_YEARLY_PRICE_ID");

    let tier = SUBSCRIPTION_TIERS.FREE;

    if (priceId === monthlyPriceId) {
      tier = SUBSCRIPTION_TIERS.MONTHLY;
    }

    if (priceId === yearlyPriceId) {
      tier = SUBSCRIPTION_TIERS.YEARLY;
    }

    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.tier = tier;
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

    await this.subscriptionRepo.save(subscription);

    LogHelpers.addBusinessContext("subscriptionUpdated", true);
    LogHelpers.addBusinessContext("newTier", tier);

    this.logger.log(`Subscription updated for user ${userId}: ${tier} (${subscription.status})`);
  }

  async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const userId = stripeSubscription.metadata.userId;

    if (!userId) {
      this.logger.error("No userId in subscription metadata");
      return;
    }

    this.logger.log(`Deleting subscription for user ${userId}`);

    const subscription = await this.subscriptionRepo.findOne({ where: { userId } });

    if (subscription) {
      subscription.tier = SUBSCRIPTION_TIERS.FREE;
      subscription.status = "canceled";
      subscription.canceledAt = new Date();

      await this.subscriptionRepo.save(subscription);

      LogHelpers.addBusinessContext("subscriptionDeleted", true);

      this.logger.log(`Subscription canceled for user ${userId}`);
    }
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<FeatureAccessResult> {
    const subscription = await this.getOrCreateSubscription(userId);

    const isPro = subscription.tier === SUBSCRIPTION_TIERS.MONTHLY || subscription.tier === SUBSCRIPTION_TIERS.YEARLY || subscription.tier === SUBSCRIPTION_TIERS.LIFETIME;

    LogHelpers.addBusinessContext("isPro", isPro);
    LogHelpers.addBusinessContext("featureChecked", feature);

    if (feature.startsWith("ai_")) {
      return { allowed: isPro };
    }

    if (feature === "entry_creation") {
      if (isPro) {
        return { allowed: true };
      }

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const usage = await this.usageRepo.findOne({
        where: { userId, featureName: "entry_creation", periodStart: currentMonth },
      });

      const usageCount = usage?.usageCount || 0;
      const limit = 6;

      LogHelpers.addBusinessContext("entryUsage", usageCount);
      LogHelpers.addBusinessContext("entryLimit", limit);

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

    LogHelpers.addBusinessContext("usageIncremented", feature);
    LogHelpers.addBusinessContext("newUsageCount", usage.usageCount);

    this.logger.log(`Incremented ${feature} usage for user ${userId}: ${usage.usageCount}`);
  }
}
```

---

## STEP 8: Backend - Controllers

### 8.1: Create Subscription Controller

**Create directory**:

```bash
mkdir -p backend/src/modules/subscription/controllers
```

**File**: `backend/src/modules/subscription/controllers/subscription.controller.ts`

```typescript
import { Controller, Post, Get, Body, Req, HttpException, HttpStatus } from "@nestjs/common";
import { SubscriptionService } from "../services/subscription.service";
import { Request } from "express";

@Controller("subscription")
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get("status")
  async getStatus(@Req() req: Request) {
    const subscription = await this.subscriptionService.getOrCreateSubscription(req.user.userId);

    return subscription;
  }

  @Post("checkout")
  async createCheckout(@Req() req: Request, @Body() body: { tier: "monthly" | "yearly"; successUrl: string; cancelUrl: string }) {
    if (!["monthly", "yearly"].includes(body.tier)) {
      throw new HttpException("Invalid tier", HttpStatus.BAD_REQUEST);
    }

    return this.subscriptionService.createCheckoutSession(req.user.userId, req.user.email, req.user.name, body.tier, body.successUrl, body.cancelUrl);
  }

  @Post("portal")
  async createPortal(@Req() req: Request, @Body() body: { returnUrl: string }) {
    return this.subscriptionService.createPortalSession(req.user.userId, body.returnUrl);
  }

  @Post("check-feature")
  async checkFeature(@Req() req: Request, @Body() body: { feature: string }) {
    return this.subscriptionService.checkFeatureAccess(req.user.userId, body.feature);
  }
}
```

### 8.2: Create Webhook Controller

**File**: `backend/src/modules/subscription/controllers/webhook.controller.ts`

```typescript
import { Controller, Post, Req, Res, HttpStatus, RawBodyRequest } from "@nestjs/common";
import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service";
import { SubscriptionService } from "../services/subscription.service";
import { Public } from "../../../decorators/public.decorator";
import Stripe from "stripe";

@Controller("stripe")
export class WebhookController {
  constructor(
    private stripeService: StripeService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Public()
  @Post("webhook")
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const signature = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.subscriptionService.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case "customer.subscription.deleted":
          await this.subscriptionService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (err) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Webhook handler failed: ${err.message}`);
    }
  }
}
```

---

## STEP 9: Backend - Guards & Decorators

### 9.1: Create Subscription Feature Decorator

**File**: `backend/src/decorators/subscription-feature.decorator.ts`

```typescript
import { SetMetadata } from "@nestjs/common";

export const SUBSCRIPTION_FEATURE_KEY = "subscriptionFeature";

export const SubscriptionFeature = (featureName: string) => SetMetadata(SUBSCRIPTION_FEATURE_KEY, featureName);
```

### 9.2: Create Subscription Guard

**File**: `backend/src/guards/subscription.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SUBSCRIPTION_FEATURE_KEY } from "../decorators/subscription-feature.decorator";
import { SubscriptionService } from "../modules/subscription/services/subscription.service";

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureName = this.reflector.getAllAndOverride<string>(SUBSCRIPTION_FEATURE_KEY, [context.getHandler(), context.getClass()]);

    if (!featureName) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
    }

    const access = await this.subscriptionService.checkFeatureAccess(userId, featureName);

    if (!access.allowed) {
      throw new HttpException(
        {
          message: "Subscription required",
          feature: featureName,
          limit: access.limit,
          usage: access.usage,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
```

---

## STEP 10: Backend - Module Integration

### 10.1: Create Subscription Module

**File**: `backend/src/modules/subscription/subscription.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Subscription } from "./models/subscription.model";
import { FeatureUsage } from "./models/usage.model";
import { SubscriptionController } from "./controllers/subscription.controller";
import { WebhookController } from "./controllers/webhook.controller";
import { SubscriptionService } from "./services/subscription.service";
import { StripeService } from "./services/stripe.service";

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, FeatureUsage]), ConfigModule],
  exports: [SubscriptionService, TypeOrmModule],
  controllers: [SubscriptionController, WebhookController],
  providers: [SubscriptionService, StripeService],
})
export class SubscriptionModule {}
```

### 10.2: Update App Module

**File**: `backend/src/app.module.ts`

Add imports at the top:

```typescript
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { SubscriptionGuard } from "./guards/subscription.guard";
import { APP_GUARD } from "@nestjs/core";
```

Add to `imports` array:

```typescript
@Module({
  imports: [
    SubscriptionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
```

---

## STEP 11: Backend - Feature Gating

### 11.1: Apply to AI Endpoints

**File**: `backend/src/modules/ai/controllers/ai.controller.ts`

Add import at top:

```typescript
import { SubscriptionFeature } from "../../../decorators/subscription-feature.decorator";
```

Add decorators to methods:

```typescript
@Post('chat')
@SubscriptionFeature('ai_chat')
public async chat(...) { ... }

@Post('query-entries')
@SubscriptionFeature('ai_query')
public async queryEntries(...) { ... }

@Post('stream-query-entries')
@SubscriptionFeature('ai_stream')
public async streamQueryEntries(...) { ... }
```

### 11.2: Apply to Entry Creation

**File**: `backend/src/modules/entries/controllers/entries.controller.ts`

Add imports:

```typescript
import { SubscriptionFeature } from "../../../decorators/subscription-feature.decorator";
import { SubscriptionService } from "../../subscription/services/subscription.service";
```

Update constructor:

```typescript
constructor(
  private readonly _entriesService: EntriesService,
  private readonly _subscriptionService: SubscriptionService,
) {}
```

Update create entry method:

```typescript
@Post()
@SubscriptionFeature('entry_creation')
public async createEntry(@Req() req: Request, @Body() entry: EntryCreationRequest) {
  const result = await this._entriesService.createEntry(req.user.userId, entry);

  await this._subscriptionService.incrementUsage(req.user.userId, 'entry_creation');

  return result;
}
```

### 11.3: Update Entries Module

**File**: `backend/src/modules/entries/entries.module.ts`

Add import:

```typescript
import { SubscriptionModule } from "../subscription/subscription.module";
```

Add to imports array:

```typescript
@Module({
  imports: [
    SubscriptionModule,
  ],
})
```

---

## STEP 12: Frontend - Types

### 12.1: Create Subscription Types

**File**: `src/app/types/subscription.types.ts`

```typescript
export type SubscriptionTier = "free" | "monthly" | "yearly" | "lifetime";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete" | "trialing";

export type Subscription = {
  id: number;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeatureAccess = {
  allowed: boolean;
  limit?: number;
  usage?: number;
};

export type PricingPlan = {
  tier: "monthly" | "yearly";
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
};
```

---

## STEP 13: Frontend - Subscription Service

### 13.1: Update Environment Files

**File**: `src/environments/environment.ts`

Add:

```typescript
export const environment: Environment = {
  stripePublishableKey: "pk_live_your_publishable_key",
};
```

**File**: `src/environments/environment.development.ts`

Add:

```typescript
export const environment: Environment = {
  stripePublishableKey: "pk_test_your_publishable_key",
};
```

### 13.2: Create Subscription Service

**File**: `src/app/services/subscription.service.ts`

```typescript
import { Injectable, computed, inject } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { apiUrl, getReq, postReq } from "../utils/httpUtils";
import { Subscription, FeatureAccess } from "../types/subscription.types";

@Injectable({ providedIn: "root" })
export class SubscriptionService {
  public subscription = rxResource<Subscription, void>({
    loader: () => getReq<Subscription>(apiUrl("subscription/status")),
  });

  public currentSubscription = computed(() => this.subscription.value());

  public isPro = computed(() => {
    const sub = this.currentSubscription();

    return sub?.tier === "monthly" || sub?.tier === "yearly" || sub?.tier === "lifetime";
  });

  public async createCheckout(tier: "monthly" | "yearly"): Promise<string> {
    const baseUrl = window.location.origin;
    const response = await postReq<{ url: string }>(apiUrl("subscription/checkout"), {
      tier,
      successUrl: `${baseUrl}/subscription?success=true`,
      cancelUrl: `${baseUrl}/subscription?canceled=true`,
    }).toPromise();

    return response.url;
  }

  public async openPortal(): Promise<string> {
    const baseUrl = window.location.origin;
    const response = await postReq<{ url: string }>(apiUrl("subscription/portal"), {
      returnUrl: `${baseUrl}/subscription`,
    }).toPromise();

    return response.url;
  }

  public async checkFeatureAccess(feature: string): Promise<FeatureAccess> {
    return postReq<FeatureAccess>(apiUrl("subscription/check-feature"), { feature }).toPromise();
  }

  public hasAiAccess(): boolean {
    return this.isPro();
  }

  public refreshSubscription(): void {
    this.subscription.reload();
  }
}

export function injectSubscriptionService() {
  return inject(SubscriptionService);
}
```

---

## STEP 14: Frontend - Subscription Page

### 14.1: Create Subscription Component

**Create directory**:

```bash
mkdir -p src/app/pages/subscription
```

**File**: `src/app/pages/subscription/subscription.component.ts`

```typescript
import { Component, computed, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { DividerModule } from "primeng/divider";
import { MessageModule } from "primeng/message";
import { SubscriptionService } from "../../services/subscription.service";
import { PricingPlan } from "../../types/subscription.types";
import { injectSuccessToast, injectErrorToast } from "../../utils/toastUtils";
import { GlobalUiService } from "../../services/global-ui.service";

@Component({
  selector: "subscription",
  standalone: true,
  imports: [CommonModule, PageContainerComponent, ButtonModule, CardModule, TagModule, DividerModule, MessageModule],
  templateUrl: "./subscription.component.html",
  styleUrl: "./subscription.component.scss",
})
export class SubscriptionComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private globalUiService = inject(GlobalUiService);
  private throwSuccessToast = injectSuccessToast();
  private throwErrorToast = injectErrorToast();

  public subscription = this.subscriptionService.currentSubscription;
  public isPro = this.subscriptionService.isPro;
  public isMobile = this.globalUiService.isMobile;
  public isLoading = signal(false);

  public plans: PricingPlan[] = [
    {
      tier: "monthly",
      name: "Monthly",
      price: 7,
      period: "month",
      features: ["Unlimited lawn entries", "All AI features", "Advanced analytics", "Priority support"],
    },
    {
      tier: "yearly",
      name: "Yearly",
      price: 60,
      period: "year",
      popular: true,
      features: ["Unlimited lawn entries", "All AI features", "Advanced analytics", "Priority support", "Save $24/year"],
    },
  ];

  public freeLimits = ["6 lawn entries per month", "Basic analytics", "AI features unavailable"];

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params["success"] === "true") {
        this.throwSuccessToast("Subscription activated successfully!");
        this.subscriptionService.refreshSubscription();
        this.router.navigate([], { queryParams: {} });
      }

      if (params["canceled"] === "true") {
        this.throwErrorToast("Subscription checkout was canceled");
        this.router.navigate([], { queryParams: {} });
      }
    });
  }

  public async subscribe(tier: "monthly" | "yearly") {
    this.isLoading.set(true);

    try {
      const checkoutUrl = await this.subscriptionService.createCheckout(tier);
      window.location.href = checkoutUrl;
    } catch (error) {
      this.throwErrorToast("Failed to start checkout");
      this.isLoading.set(false);
    }
  }

  public async manageSubscription() {
    this.isLoading.set(true);

    try {
      const portalUrl = await this.subscriptionService.openPortal();
      window.location.href = portalUrl;
    } catch (error) {
      this.throwErrorToast("Failed to open billing portal");
      this.isLoading.set(false);
    }
  }

  public get subscriptionEndDate(): string | null {
    const sub = this.subscription();

    if (!sub?.currentPeriodEnd) {
      return null;
    }

    return new Date(sub.currentPeriodEnd).toLocaleDateString();
  }

  public get isSubscriptionActive(): boolean {
    const sub = this.subscription();

    return sub?.status === "active" && this.isPro();
  }

  public get willCancelAtPeriodEnd(): boolean {
    return this.subscription()?.cancelAtPeriodEnd || false;
  }

  public get tierDisplayName(): string {
    const tier = this.subscription()?.tier;

    if (tier === "lifetime") {
      return "Pro (Lifetime)";
    }

    if (tier === "monthly") {
      return "Pro (Monthly)";
    }

    if (tier === "yearly") {
      return "Pro (Yearly)";
    }

    return "Free";
  }
}
```

### 14.2: Create Subscription Template

**File**: `src/app/pages/subscription/subscription.component.html`

```html
<page-container title="Subscription">
  @if (isPro()) {
  <p-message severity="success" [closable]="false">
    <div class="flex flex-column gap-2">
      <strong>{{ tierDisplayName }}</strong>

      @if (subscription()?.tier !== 'lifetime') {
      <span>Your {{ subscription()?.tier }} plan is active until {{ subscriptionEndDate }}</span>
      } @else {
      <span>You have lifetime pro access! Thank you for being an early adopter.</span>
      } @if (willCancelAtPeriodEnd) {
      <span class="text-orange-500">Will cancel at period end</span>
      }
    </div>
  </p-message>

  @if (subscription()?.tier !== 'lifetime') {
  <div class="flex justify-content-center mt-4">
    <p-button label="Manage Subscription" icon="ti ti-settings" (onClick)="manageSubscription()" [loading]="isLoading()" />
  </div>
  }

  <p-divider />
  } @else {
  <p-message severity="info" [closable]="false">
    <div class="flex flex-column gap-2">
      <strong>Free Plan</strong>
      <span>Upgrade to unlock unlimited entries and AI features</span>
    </div>
  </p-message>
  } @if (!isPro()) {
  <div class="free-limits mt-4">
    <h3>Current Limitations (Free)</h3>
    <ul>
      @for (limit of freeLimits; track limit) {
      <li>{{ limit }}</li>
      }
    </ul>
  </div>

  <p-divider />
  }

  <div class="pricing-container">
    <h2 class="text-center mb-4">Upgrade to Pro</h2>

    <div class="grid justify-content-center">
      @for (plan of plans; track plan.tier) {
      <div class="col-12 md:col-6 lg:col-5">
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header-content">
              <h3>{{ plan.name }}</h3>

              @if (plan.popular) {
              <p-tag value="Most Popular" severity="success" />
              }
            </div>
          </ng-template>

          <div class="pricing-content">
            <div class="price-section">
              <span class="price">${{ plan.price }}</span>
              <span class="period">/ {{ plan.period }}</span>
            </div>

            <p-divider />

            <ul class="features-list">
              @for (feature of plan.features; track feature) {
              <li>
                <i class="ti ti-check"></i>
                <span>{{ feature }}</span>
              </li>
              }
            </ul>

            <p-button [label]="isPro() && subscription()?.tier === plan.tier ? 'Current Plan' : 'Subscribe'" [disabled]="isPro() && (subscription()?.tier === plan.tier || subscription()?.tier === 'lifetime')" [loading]="isLoading()" (onClick)="subscribe(plan.tier)" styleClass="w-full" [severity]="plan.popular ? 'success' : 'primary'" />
          </div>
        </p-card>
      </div>
      }
    </div>
  </div>
</page-container>
```

### 14.3: Create Subscription Styles

**File**: `src/app/pages/subscription/subscription.component.scss`

```scss
.pricing-container {
  margin-top: 2rem;
}

.card-header-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.pricing-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.price-section {
  text-align: center;

  .price {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--p-primary-500);
  }

  .period {
    font-size: 1rem;
    color: var(--p-text-muted-color);
  }
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i {
      color: var(--p-green-500);
      font-size: 1.2rem;
    }
  }
}

.free-limits {
  ul {
    list-style: disc;
    padding-left: 1.5rem;

    li {
      padding: 0.25rem 0;
    }
  }
}
```

### 14.4: Create Upgrade Prompt Component

**Create directory**:

```bash
mkdir -p src/app/components/subscription
```

**File**: `src/app/components/subscription/upgrade-prompt/upgrade-prompt.component.ts`

```typescript
import { Component, Input, inject } from "@angular/core";
import { Router } from "@angular/router";
import { MessageModule } from "primeng/message";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "upgrade-prompt",
  standalone: true,
  imports: [MessageModule, ButtonModule],
  template: `
    <p-message severity="warn" [closable]="false">
      <div class="flex flex-column gap-3">
        <span>{{ message }}</span>
        <p-button label="Upgrade to Pro" icon="ti ti-crown" size="small" (onClick)="navigateToSubscription()" />
      </div>
    </p-message>
  `,
})
export class UpgradePromptComponent {
  @Input() message = "Upgrade to unlock this feature";
  private router = inject(Router);

  navigateToSubscription() {
    this.router.navigate(["/subscription"]);
  }
}
```

---

## STEP 15: Frontend - Routing & Navigation

### 15.1: Add Subscription Route

**File**: `src/app/app.routes.ts`

Add import:

```typescript
import { SubscriptionComponent } from "./pages/subscription/subscription.component";
```

Add route to `mainRoutes`:

```typescript
export const mainRoutes: Routes = [
  {
    path: "subscription",
    component: SubscriptionComponent,
    canActivate: [hybridAuthGuard],
  },
];
```

### 15.2: Add Navigation Item

**File**: `src/app/config/navigation.config.ts`

Add to `NAV_ITEMS`:

```typescript
{
  label: 'Subscription',
  icon: 'ti ti-crown',
  routerLink: '/subscription',
}
```

---

## STEP 16: Frontend - Feature Gating

### 16.1: Update Add Entry Component

**File**: `src/app/pages/entry-log/add-entry/add-entry.component.ts`

Add imports:

```typescript
import { SubscriptionService } from "../../../services/subscription.service";
import { Router } from "@angular/router";
import { injectErrorToast } from "../../../utils/toastUtils";
```

Add to constructor/inject:

```typescript
private subscriptionService = inject(SubscriptionService);
private router = inject(Router);
private throwErrorToast = injectErrorToast();
```

Add check in `ngOnInit`:

```typescript
async ngOnInit() {
  const access = await this.subscriptionService.checkFeatureAccess('entry_creation');

  if (!access.allowed) {
    this.throwErrorToast(
      `Entry limit reached (${access.usage}/${access.limit}). Upgrade for unlimited entries.`
    );
    this.router.navigate(['/subscription']);
  }
}
```

### 16.2: Gate AI Features

Find all AI-related components and add checks. Example pattern:

```typescript
private subscriptionService = inject(SubscriptionService);
public hasAiAccess = this.subscriptionService.isPro;
```

```html
@if (hasAiAccess()) {
<!-- AI UI here -->
} @else {
<upgrade-prompt message="Upgrade to unlock AI-powered lawn analysis" />
}
```

---

## STEP 17: Testing

### 17.1: Local Backend Testing

```bash
cd backend
npm run start:dev
```

Test endpoints with Postman or curl:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/subscription/status

curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature":"entry_creation"}' \
  http://localhost:3000/subscription/check-feature
```

### 17.2: Local Webhook Testing

```bash
stripe listen --forward-to localhost:3000/stripe/webhook

stripe trigger customer.subscription.created
```

### 17.3: Frontend Testing

```bash
cd ../
npm run start
```

Visit `http://localhost:4200/subscription`

Use Stripe test cards:

- Success: `4242 4242 4242 4242`
- Requires auth: `4000 0025 0000 3155`
- Decline: `4000 0000 0000 0002`

Test scenarios:

1. Subscribe to monthly plan
2. Verify subscription status updates
3. Try creating 7th entry as free user
4. Access AI features as free/pro user
5. Open billing portal and cancel

---

## STEP 18: Deployment

### 18.1: Deploy Backend

1. Push code to Railway:

```bash
cd backend
git add .
git commit -m "Add subscription feature"
git push
```

2. Add environment variables in Railway dashboard:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Run migrations:

```bash
npm run migration:run
```

### 18.2: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-backend.railway.app/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy "Signing secret" and update Railway env: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 18.3: Deploy Frontend

1. Update environment for production in `src/environments/environment.ts`:

```typescript
stripePublishableKey: "pk_live_...";
```

2. Deploy to Netlify:

```bash
git add .
git commit -m "Add subscription UI"
git push
```

### 18.4: Switch to Live Mode

1. Stripe Dashboard → Switch to Live Mode
2. Create products/prices with same structure
3. Update all environment variables to use `sk_live_` and `pk_live_` keys
4. Re-configure webhook in live mode

---

## STEP 19: Verification Checklist

### Backend

- [ ] Migrations ran successfully
- [ ] Existing users show `tier='lifetime'` in database
- [ ] `/subscription/status` returns subscription data
- [ ] `/subscription/checkout` creates Stripe session
- [ ] `/subscription/portal` creates portal session
- [ ] Webhook receives and processes events
- [ ] AI endpoints block free users (402 error)
- [ ] Entry creation blocks after 6 for free users
- [ ] Usage counter increments correctly

### Frontend

- [ ] `/subscription` page loads
- [ ] Pricing cards show $7/month and $60/year
- [ ] Subscribe button redirects to Stripe
- [ ] Return from Stripe shows success message
- [ ] Subscription status updates
- [ ] Billing portal opens correctly
- [ ] Free users see limitations
- [ ] AI features show upgrade prompt for free users
- [ ] Entry limit warning appears
- [ ] Lifetime users see special badge
- [ ] Navigation shows subscription link

### End-to-End

- [ ] New user defaults to free tier
- [ ] Free user can create 6 entries
- [ ] 7th entry shows limit error
- [ ] Subscribe flow completes successfully
- [ ] Pro user has unlimited entries
- [ ] Pro user accesses AI features
- [ ] Billing portal allows cancellation
- [ ] Canceled subscription continues until period end
- [ ] Existing users have lifetime access

---

## Troubleshooting

### Webhook Not Working

- Verify webhook secret matches Stripe Dashboard
- Check Railway logs for webhook errors
- Use Stripe Dashboard → Webhooks → Events to see delivery attempts
- Ensure `@Public()` decorator is on webhook endpoint

### Checkout Redirect Fails

- Check CORS settings if frontend/backend on different domains
- Verify success/cancel URLs are correct
- Check browser console for errors

### Migration Errors

- Ensure database connection is correct
- Check if tables already exist
- Verify TypeORM config matches database

### Feature Gating Not Working

- Ensure SubscriptionGuard is registered globally
- Check decorator is applied to endpoints
- Verify service is injected in guard
- Check user ID is present in request

---

## Next Steps

After successful deployment:

1. Monitor Stripe Dashboard for subscription events
2. Track usage metrics in database
3. Add email notifications for subscription changes (future)
4. Implement usage analytics dashboard (future)
5. Consider promo codes for marketing (future)

---

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Test Cards: https://stripe.com/docs/testing
- Webhook Testing: https://stripe.com/docs/webhooks/test
