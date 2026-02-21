import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionController } from "./controllers/subscription.controller";
import { WebhookController } from "./controllers/webhook.controller";
import { UsageTrackingListener } from "./listeners/usage-tracking.listener";
import { Subscription } from "./models/subscription.model";
import { FeatureUsage } from "./models/usage.model";
import { WebhookEvent } from "./models/webhook-event.model";
import { StripeService } from "./services/stripe.service";
import { SubscriptionService } from "./services/subscription.service";

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
	providers: [SubscriptionService, StripeService, UsageTrackingListener],
})
export class SubscriptionModule {}
