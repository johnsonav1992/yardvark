import { SetMetadata } from "@nestjs/common";

export const FEATURE_FLAG_KEY = "featureFlag";

/**
 * A decorator that marks a route as controlled by a feature flag.
 *
 * When applied to a route handler, this decorator allows conditional access based on
 * a feature flag name. The actual enabling/disabling logic is handled by a guard or interceptor
 * that checks the feature flag status.
 *
 * @param flagName - The name of the feature flag to check
 * @returns A decorator function that can be applied to route handlers
 * @example
 * ```typescript
 * @FeatureFlag('ENABLE_ENTRY_QUERY')
 * @Post('query-entries')
 * queryEntries() {
 *   // This endpoint is controlled by the ENABLE_ENTRY_QUERY flag
 * }
 * ```
 */
export const FeatureFlag = (flagName: string) =>
	SetMetadata(FEATURE_FLAG_KEY, flagName);
