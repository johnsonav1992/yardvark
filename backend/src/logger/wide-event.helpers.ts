import { Request } from 'express';
import { WideEventContext } from './logger';

/**
 * Helper utilities for enriching wide event context during request processing
 *
 * Services and controllers can use these to add telemetry to the canonical log line
 * that will be emitted at the end of the request.
 *
 * Example usage in a service:
 *
 * ```typescript
 * import { WideEventHelpers } from 'src/logger/wide-event.helpers';
 *
 * async getUserData(userId: string, request: Request) {
 *   const start = Date.now();
 *   try {
 *     const result = await this.repository.find({ userId });
 *     WideEventHelpers.recordDatabaseCall(request, Date.now() - start, false);
 *     return result;
 *   } catch (error) {
 *     WideEventHelpers.recordDatabaseCall(request, Date.now() - start, true);
 *     throw error;
 *   }
 * }
 * ```
 */
export class WideEventHelpers {
  /**
   * Get the wide event context from the request
   */
  private static getContext(request: Request): WideEventContext | undefined {
    return (request as any).wideEventContext;
  }

  /**
   * Record a database call for telemetry
   */
  static recordDatabaseCall(
    request: Request,
    durationMs: number,
    failed = false,
  ): void {
    const context = this.getContext(request);
    if (!context?.database) return;

    context.database.numCalls++;
    if (failed) {
      context.database.numFailures++;
    }

    if (durationMs) {
      context.database.totalDurationMs =
        (context.database.totalDurationMs || 0) + durationMs;
      context.database.slowestQueryMs = Math.max(
        context.database.slowestQueryMs || 0,
        durationMs,
      );
    }
  }

  /**
   * Record a cache hit
   */
  static recordCacheHit(request: Request): void {
    const context = this.getContext(request);
    if (!context?.cache) return;
    context.cache.hits++;
  }

  /**
   * Record a cache miss
   */
  static recordCacheMiss(request: Request): void {
    const context = this.getContext(request);
    if (!context?.cache) return;
    context.cache.misses++;
  }

  /**
   * Record an external API call
   */
  static recordExternalCall(
    request: Request,
    service: string,
    durationMs: number,
    success: boolean,
    statusCode?: number,
  ): void {
    const context = this.getContext(request);
    if (!context?.externalCalls) return;

    context.externalCalls.push({
      service,
      durationMs,
      success,
      statusCode,
    });
  }

  /**
   * Add business context to the wide event
   */
  static addBusinessContext(
    request: Request,
    key: string,
    value: unknown,
  ): void {
    const context = this.getContext(request);
    if (!context) return;

    if (!context.business) {
      context.business = {};
    }
    context.business[key] = value;
  }

  /**
   * Record feature flag usage
   */
  static recordFeatureFlag(
    request: Request,
    flagName: string,
    enabled: boolean,
  ): void {
    const context = this.getContext(request);
    if (!context) return;

    if (!context.featureFlags) {
      context.featureFlags = {};
    }
    context.featureFlags[flagName] = enabled;
  }

  /**
   * Add custom metadata
   */
  static addMetadata(request: Request, key: string, value: unknown): void {
    const context = this.getContext(request);
    if (!context) return;

    if (!context.metadata) {
      context.metadata = {};
    }
    context.metadata[key] = value;
  }

  /**
   * Convenience method to wrap a database operation with automatic telemetry
   */
  static async withDatabaseTelemetry<T>(
    request: Request,
    operation: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      this.recordDatabaseCall(request, Date.now() - start, false);
      return result;
    } catch (error) {
      this.recordDatabaseCall(request, Date.now() - start, true);
      throw error;
    }
  }

  /**
   * Convenience method to wrap an external API call with automatic telemetry
   */
  static async withExternalCallTelemetry<T>(
    request: Request,
    serviceName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      this.recordExternalCall(
        request,
        serviceName,
        Date.now() - start,
        true,
        200,
      );
      return result;
    } catch (error: any) {
      this.recordExternalCall(
        request,
        serviceName,
        Date.now() - start,
        false,
        error?.response?.status || 500,
      );
      throw error;
    }
  }
}
