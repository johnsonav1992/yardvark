import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * A decorator that marks a route as exempt from rate limiting.
 *
 * When applied to a route handler, this decorator bypasses the global throttle guard.
 * Use this sparingly and only for routes that need unlimited access (e.g., health checks).
 *
 * @returns A decorator function that can be applied to route handlers
 * @example
 * ```typescript
 * @SkipThrottle()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
