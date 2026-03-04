import { httpResource } from "@angular/common/http";
import { computed, Injectable } from "@angular/core";
import type {
	FeatureAccess,
	PricingResponse,
	PurchasableTier,
	Subscription,
} from "../types/subscription.types";
import { apiUrl, postReq } from "../utils/httpUtils";

@Injectable({ providedIn: "root" })
export class SubscriptionService {
	public subscription = httpResource<Subscription>(() =>
		apiUrl("subscription/status"),
	);

	public pricing = httpResource<PricingResponse>(() =>
		apiUrl("subscription/pricing"),
	);

	public currentSubscription = computed(() => this.subscription.value());
	public isLoading = computed(() => this.subscription.isLoading());
	public currentPricing = computed(() => this.pricing.value());
	public isPricingLoading = computed(() => this.pricing.isLoading());

	public isPro = computed(() => {
		const sub = this.currentSubscription();

		if (!sub) {
			return false;
		}

		const hasPaidTier =
			sub.tier === "monthly" ||
			sub.tier === "yearly" ||
			sub.tier === "lifetime";

		if (!hasPaidTier) {
			return false;
		}

		if (sub.tier === "lifetime") {
			return true;
		}

		return sub.status === "active" || sub.status === "trialing";
	});

	public createCheckout(tier: PurchasableTier) {
		const baseUrl = window.location.origin;

		return postReq<{ url: string }>(apiUrl("subscription/checkout"), {
			tier,
			successUrl: `${baseUrl}/subscription?success=true`,
			cancelUrl: `${baseUrl}/subscription?canceled=true`,
		});
	}

	public openPortal() {
		const baseUrl = window.location.origin;

		return postReq<{ url: string }>(apiUrl("subscription/portal"), {
			returnUrl: `${baseUrl}/subscription`,
		});
	}

	public checkFeatureAccess(feature: string) {
		return postReq<FeatureAccess>(apiUrl("subscription/check-feature"), {
			feature,
		});
	}

	public hasAiAccess(): boolean {
		return this.isPro();
	}

	public refreshSubscription(): void {
		this.subscription.reload();
	}
}
