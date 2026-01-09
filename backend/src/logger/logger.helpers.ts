import { LogContext } from './logger.types';
import { getLogContext } from './logger.context';

export class LogHelpers {
  private static getContext(): LogContext | undefined {
    return getLogContext();
  }

  static recordDatabaseCall(durationMs: number, failed = false): void {
    const context = this.getContext();

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

  static recordCacheHit(): void {
    const context = this.getContext();

    if (!context?.cache) return;

    context.cache.hits++;
  }

  static recordCacheMiss(): void {
    const context = this.getContext();

    if (!context?.cache) return;

    context.cache.misses++;
  }

  static recordExternalCall(
    service: string,
    durationMs: number,
    success: boolean,
    statusCode?: number,
  ): void {
    const context = this.getContext();

    if (!context?.externalCalls) return;

    context.externalCalls.push({
      service,
      durationMs,
      success,
      statusCode,
    });
  }

  static addBusinessContext(key: string, value: unknown): void {
    const context = this.getContext();

    if (!context) return;

    if (!context.business) {
      context.business = {};
    }

    context.business[key] = value;
  }

  static recordFeatureFlag(flagName: string, enabled: boolean): void {
    const context = this.getContext();

    if (!context) return;

    if (!context.featureFlags) {
      context.featureFlags = {};
    }

    context.featureFlags[flagName] = enabled;
  }

  static addMetadata(key: string, value: unknown): void {
    const context = this.getContext();

    if (!context) return;

    if (!context.metadata) {
      context.metadata = {};
    }

    context.metadata[key] = value;
  }

  static async withDatabaseTelemetry<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    const context = this.getContext();

    if (!context) {
      return operation();
    }

    const start = Date.now();

    try {
      const result = await operation();

      this.recordDatabaseCall(Date.now() - start, false);

      return result;
    } catch (error) {
      this.recordDatabaseCall(Date.now() - start, true);

      throw error;
    }
  }

  static async withExternalCallTelemetry<T>(
    serviceName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const context = this.getContext();

    if (!context) {
      return operation();
    }

    const start = Date.now();

    try {
      const result = await operation();

      this.recordExternalCall(serviceName, Date.now() - start, true);

      return result;
    } catch (error: unknown) {
      const statusCode = this.extractStatusCode(error);

      this.recordExternalCall(
        serviceName,
        Date.now() - start,
        false,
        statusCode,
      );

      throw error;
    }
  }

  private static extractStatusCode(error: unknown): number {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      typeof error.response.status === 'number'
    ) {
      return error.response.status;
    }
    return 500;
  }
}
