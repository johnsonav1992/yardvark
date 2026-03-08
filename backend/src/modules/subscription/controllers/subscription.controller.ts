import { Body, Controller, Get, Post } from "@nestjs/common";
import { User } from "../../../decorators/user.decorator";
import { ResourceValidationError } from "../../../errors/resource-error";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { error } from "../../../types/either";
import type { ExtractedUserRequestData } from "../../../types/request";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import {
	PURCHASABLE_TIERS,
	type PurchasableTier,
} from "../models/subscription.types";
import { SubscriptionService } from "../services/subscription.service";

@Controller("subscription")
export class SubscriptionController {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	@Get("status")
	public async getStatus(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_status",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return resultOrThrow(
			await this.subscriptionService.getOrCreateSubscription(userId),
		);
	}

	@Get("pricing")
	public async getPricing() {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_pricing",
		);

		return resultOrThrow(await this.subscriptionService.getPricing());
	}

	@Post("checkout")
	public async createCheckout(
		@User() user: ExtractedUserRequestData,
		@Body()
		body: { tier: PurchasableTier; successUrl: string; cancelUrl: string },
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"create_checkout",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, user.userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.requestedTier, body.tier);

		if (!PURCHASABLE_TIERS.includes(body.tier)) {
			LogHelpers.addBusinessContext(BusinessContextKeys.invalidTier, body.tier);

			return resultOrThrow(
				error(
					new ResourceValidationError({
						message: `Invalid tier: ${body.tier}. Must be one of: ${PURCHASABLE_TIERS.join(", ")}`,
						code: "INVALID_SUBSCRIPTION_TIER",
					}),
				),
			);
		}

		return resultOrThrow(
			await this.subscriptionService.createCheckoutSession(
				user.userId,
				user.email,
				user.name,
				body.tier,
				body.successUrl,
				body.cancelUrl,
			),
		);
	}

	@Post("portal")
	public async createPortal(
		@User("userId") userId: string,
		@Body() body: { returnUrl: string },
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"create_portal",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return resultOrThrow(
			await this.subscriptionService.createPortalSession(
				userId,
				body.returnUrl,
			),
		);
	}

	@Post("check-feature")
	public async checkFeature(
		@User("userId") userId: string,
		@Body() body: { feature: string },
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"check_feature",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.featureName,
			body.feature,
		);

		return resultOrThrow(
			await this.subscriptionService.checkFeatureAccess(userId, body.feature),
		);
	}
}
