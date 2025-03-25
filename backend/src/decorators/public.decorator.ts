import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * A decorator that marks a route as public, bypassing authentication.
 *
 * This decorator sets a metadata value using Nest.js's `SetMetadata` function,
 * indicating that the decorated route handler should be publicly accessible
 * without authentication checks.
 *
 * @returns A decorator function that can be applied to route handlers
 * @example
 * ```typescript
 * *@Public()*
 * *@Get('login')*
 * login() {
 *   // This endpoint is accessible without authentication
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
