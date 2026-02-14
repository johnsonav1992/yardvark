import {
  ResourceError,
  ResourceNotFound,
  ResourceValidationError,
  ExternalServiceError,
} from '../../../errors/resource-error';

export class SubscriptionNotFound extends ResourceNotFound {
  constructor() {
    super({
      message: 'No subscription record found for user',
      code: 'SUBSCRIPTION_NOT_FOUND',
    });
  }
}

export class StripeCustomerNotFound extends ResourceNotFound {
  constructor() {
    super({
      message: 'No Stripe customer associated with subscription',
      code: 'STRIPE_CUSTOMER_NOT_FOUND',
    });
  }
}

export class InvalidTier extends ResourceValidationError {
  constructor(tier: string, validTiers: string[]) {
    super({
      message: `Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`,
      code: 'INVALID_TIER',
    });
  }
}

export class PriceIdNotConfigured extends ResourceError {
  constructor(tier: string) {
    super({
      message: `Price ID not configured for tier: ${tier}`,
      code: 'PRICE_ID_NOT_CONFIGURED',
      statusCode: 500,
    });
  }
}

export class CheckoutUrlMissing extends ResourceError {
  constructor() {
    super({
      message: 'Checkout session created but missing URL',
      code: 'CHECKOUT_URL_MISSING',
      statusCode: 500,
    });
  }
}

export class PortalUrlMissing extends ResourceError {
  constructor() {
    super({
      message: 'Portal session created but missing URL',
      code: 'PORTAL_URL_MISSING',
      statusCode: 500,
    });
  }
}

export class MissingUserId extends ResourceValidationError {
  constructor() {
    super({
      message: 'Webhook missing userId in subscription metadata',
      code: 'MISSING_USER_ID',
    });
  }
}

export class StripeCustomerVerificationError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to verify Stripe customer',
      code: 'STRIPE_CUSTOMER_VERIFICATION_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class StripeCustomerCreationError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to create Stripe customer',
      code: 'STRIPE_CUSTOMER_CREATION_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class CheckoutSessionCreationError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to create checkout session',
      code: 'CHECKOUT_SESSION_CREATION_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class PortalSessionCreationError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to create portal session',
      code: 'PORTAL_SESSION_CREATION_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class SubscriptionUpdateError extends ResourceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to update subscription',
      code: 'SUBSCRIPTION_UPDATE_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class MissingPriceId extends ResourceValidationError {
  constructor() {
    super({
      message: 'Subscription missing price ID',
      code: 'MISSING_PRICE_ID',
    });
  }
}
