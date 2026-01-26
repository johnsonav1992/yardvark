export type SubscriptionTier = 'free' | 'monthly' | 'yearly' | 'lifetime';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'incomplete'
  | 'trialing';

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
  tier: 'monthly' | 'yearly';
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
};
