import { UseGuards } from "@nestjs/common";
import { Context, Query, Resolver } from "@nestjs/graphql";
import { GqlAuthGuard } from "../../../guards/gql-auth.guard";
import type { GqlContext } from "../../../types/gql-context";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import { Subscription } from "../models/subscription.model";
import { FeatureUsage } from "../models/usage.model";
import { SubscriptionService } from "../services/subscription.service";

@Resolver(() => Subscription)
@UseGuards(GqlAuthGuard)
export class SubscriptionResolver {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	@Query(() => Subscription, { name: "subscription", nullable: true })
	async getSubscription(@Context() ctx: GqlContext): Promise<Subscription> {
		const result = await this.subscriptionService.getOrCreateSubscription(
			ctx.req.user.userId,
		);

		return resultOrThrow(result);
	}

	@Query(() => [FeatureUsage], { name: "featureUsage" })
	async getFeatureUsage(@Context() ctx: GqlContext): Promise<FeatureUsage[]> {
		return this.subscriptionService.getFeatureUsage(ctx.req.user.userId);
	}
}
