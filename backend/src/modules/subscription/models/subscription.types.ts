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

export type SubscriptionTier =
	(typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

export type SubscriptionStatus =
	(typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];

export type PurchasableTier =
	| typeof SUBSCRIPTION_TIERS.MONTHLY
	| typeof SUBSCRIPTION_TIERS.YEARLY;

export const PURCHASABLE_TIERS: PurchasableTier[] = [
	SUBSCRIPTION_TIERS.MONTHLY,
	SUBSCRIPTION_TIERS.YEARLY,
];

export type PricingInfo = {
	tier: PurchasableTier;
	amount: number;
	currency: string;
	interval: "month" | "year";
};

export type PricingResponse = {
	prices: PricingInfo[];
};
