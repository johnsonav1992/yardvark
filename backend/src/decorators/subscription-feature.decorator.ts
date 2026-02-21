import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_FEATURE_KEY = 'subscriptionFeature';

export const SubscriptionFeature = (featureName: string) =>
  SetMetadata(SUBSCRIPTION_FEATURE_KEY, featureName);
