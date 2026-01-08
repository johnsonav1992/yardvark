import { Request } from 'express';
import { LogContext } from './logger.types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      traceId?: string;
      requestId?: string;
      logContext?: LogContext;
    }
  }
}

export class LogHelpers {
  private static getContext(request: Request): LogContext | undefined {
    return request.logContext;
  }

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

  static recordCacheHit(request: Request): void {
    const context = this.getContext(request);
    if (!context?.cache) return;
    context.cache.hits++;
  }

  static recordCacheMiss(request: Request): void {
    const context = this.getContext(request);
    if (!context?.cache) return;
    context.cache.misses++;
  }

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

  static addMetadata(request: Request, key: string, value: unknown): void {
    const context = this.getContext(request);
    if (!context) return;

    if (!context.metadata) {
      context.metadata = {};
    }
    context.metadata[key] = value;
  }

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

  static async withExternalCallTelemetry<T>(
    request: Request,
    serviceName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      this.recordExternalCall(request, serviceName, Date.now() - start, true);
      return result;
    } catch (error: unknown) {
      const statusCode = this.extractStatusCode(error);
      this.recordExternalCall(
        request,
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
