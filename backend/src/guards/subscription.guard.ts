import {
	type CanActivate,
	type ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SUBSCRIPTION_FEATURE_KEY } from "../decorators/subscription-feature.decorator";
import {
	type FeatureAccessResult,
	SubscriptionService,
} from "../modules/subscription/services/subscription.service";

@Injectable()
export class SubscriptionGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private subscriptionService: SubscriptionService,
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const featureName = this.getFeatureName(context);

		if (!featureName) {
			return true;
		}

		const userId = this.getUserIdFromRequest(context);
		const access = await this.checkFeatureAccess(userId, featureName);

		if (!access.allowed) {
			this.throwAccessDenied(featureName, access);
		}

		return true;
	}

	private getFeatureName(context: ExecutionContext): string | undefined {
		return this.reflector.getAllAndOverride<string>(
			SUBSCRIPTION_FEATURE_KEY,
			[context.getHandler(), context.getClass()],
		);
	}

	private getUserIdFromRequest(context: ExecutionContext): string {
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.userId;

		if (!userId) {
			throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
		}

		return userId;
	}

	private async checkFeatureAccess(
		userId: string,
		featureName: string,
	): Promise<FeatureAccessResult> {
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

		return accessResult.value;
	}

	private buildAccessDeniedMessage(
		featureName: string,
		access: FeatureAccessResult,
	): string {
		if (this.isEntryCreationFeature(featureName, access)) {
			return this.buildEntryCreationMessage(access);
		}

		if (this.isAiFeature(featureName)) {
			return this.buildAiFeatureMessage();
		}

		return this.buildDefaultMessage();
	}

	private isEntryCreationFeature(
		featureName: string,
		access: FeatureAccessResult,
	): boolean {
		return (
			featureName === "entry_creation" &&
			access.limit !== undefined &&
			access.usage !== undefined
		);
	}

	private isAiFeature(featureName: string): boolean {
		return featureName.startsWith("ai_");
	}

	private buildEntryCreationMessage(access: FeatureAccessResult): string {
		return `Entry limit reached (${access.usage}/${access.limit}). Upgrade for unlimited entries.`;
	}

	private buildAiFeatureMessage(): string {
		return "AI features require a Pro subscription. Upgrade to unlock.";
	}

	private buildDefaultMessage(): string {
		return "Subscription required";
	}

	private throwAccessDenied(
		featureName: string,
		access: FeatureAccessResult,
	): never {
		const message = this.buildAccessDeniedMessage(featureName, access);

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
}
