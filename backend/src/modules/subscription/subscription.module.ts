import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { Subscription } from './models/subscription.model';
import { FeatureUsage } from './models/usage.model';
import { WebhookEvent } from './models/webhook-event.model';
import { SubscriptionController } from './controllers/subscription.controller';
import { WebhookController } from './controllers/webhook.controller';
import { SubscriptionService } from './services/subscription.service';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, FeatureUsage, WebhookEvent]),
    ConfigModule,
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000,
      max: 1000,
    }),
  ],
  exports: [SubscriptionService, TypeOrmModule],
  controllers: [SubscriptionController, WebhookController],
  providers: [SubscriptionService, StripeService],
})
export class SubscriptionModule {}
