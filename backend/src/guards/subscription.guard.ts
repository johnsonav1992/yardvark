import {
	type CanActivate,
	type ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SUBSCRIPTION_FEATURE_KEY } from "../decorators/subscription-feature.decorator";
import { SubscriptionService } from "../modules/subscription/services/subscription.service";

@Injectable()
export class SubscriptionGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private subscriptionService: SubscriptionService,
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const featureName = this.reflector.getAllAndOverride<string>(
			SUBSCRIPTION_FEATURE_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!featureName) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const userId = request.user?.userId;

		if (!userId) {
			throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
		}

		const accessResult = await this.subscriptionService.checkFeatureAccess(
			userId,
			featureName,
		);

		if (accessResult.isError()) {
			throw new HttpException(
				accessResult.value.message,
				accessResult.value.statusCode,
			);
		}

		const access = accessResult.value;

		if (!access.allowed) {
			let message = "Subscription required";

			if (
				featureName === "entry_creation" &&
				access.limit !== undefined &&
				access.usage !== undefined
			) {
				message = `Entry limit reached (${access.usage}/${access.limit}). Upgrade for unlimited entries.`;
			} else if (featureName.startsWith("ai_")) {
				message = "AI features require a Pro subscription. Upgrade to unlock.";
			}

			throw new HttpException(
				{
					message,
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
