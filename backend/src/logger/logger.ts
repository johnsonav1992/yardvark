import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

/**
 * Wide Event Logging Interceptor
 *
 * Implements the "wide events" or "canonical log lines" pattern from loggingsucks.com
 *
 * Key principles:
 * - One rich, structured log entry per request
 * - Contains comprehensive context for debugging and analytics
 * - Machine-readable JSON format for easy querying
 * - Includes correlation IDs for distributed tracing
 * - Captures business-relevant metadata alongside technical details
 * - Accumulates application telemetry (DB calls, cache, external APIs)
 */

/**
 * Context object for accumulating telemetry throughout request lifecycle
 * Can be enriched by services/controllers during request processing
 */
export interface WideEventContext {
  // Database telemetry
  database?: {
    numCalls: number;
    numFailures: number;
    totalDurationMs?: number;
    slowestQueryMs?: number;
  };

  // Cache telemetry
  cache?: {
    hits: number;
    misses: number;
  };

  // External API calls
  externalCalls?: Array<{
    service: string;
    durationMs: number;
    success: boolean;
    statusCode?: number;
  }>;

  // Business/domain context
  business?: Record<string, unknown>;

  // Feature flags
  featureFlags?: Record<string, boolean>;

  // Custom metadata
  metadata?: Record<string, unknown>;
}

interface WideEventLog {
  // Correlation & Timing
  timestamp: string;
  traceId: string;
  requestId: string;
  durationMs: number;

  // HTTP Context
  method: string;
  url: string;
  path: string;
  statusCode: number;
  statusCategory: 'success' | 'redirect' | 'client_error' | 'server_error';

  // User Context
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
  };

  // Request Details
  userAgent?: string;
  ip?: string;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;

  // Response Context
  response?: {
    body?: unknown;
    contentType?: string;
    size?: number;
  };

  // Response & Error Context
  success: boolean;
  error?: {
    message: string;
    type: string;
    code?: string;
    stack?: string; // Only in non-production
  };

  // Application Telemetry (from WideEventContext)
  database?: WideEventContext['database'];
  cache?: WideEventContext['cache'];
  externalCalls?: WideEventContext['externalCalls'];
  business?: WideEventContext['business'];
  featureFlags?: WideEventContext['featureFlags'];
  metadata?: WideEventContext['metadata'];

  // Infrastructure Context
  eventType: 'http_request';
  environment: string;
  service: string;
}

@Injectable({ scope: Scope.REQUEST })
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('WideEvents');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // Generate correlation IDs for tracking
    const traceId = this.getOrCreateTraceId(request);
    const requestId = randomUUID();

    // Initialize wide event context for accumulating telemetry
    const wideEventContext: WideEventContext = {
      database: { numCalls: 0, numFailures: 0 },
      cache: { hits: 0, misses: 0 },
      externalCalls: [],
    };

    // Attach IDs and context to request for downstream use
    (request as any).traceId = traceId;
    (request as any).requestId = requestId;
    (request as any).wideEventContext = wideEventContext;

    const start = Date.now();
    let responseBody: unknown;

    return next.handle().pipe(
      tap((body) => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;

        // Capture response body for logging (will be sanitized)
        responseBody = body;

        this.logWideEvent({
          request,
          response,
          responseBody,
          statusCode,
          duration,
          traceId,
          requestId,
          success: true,
          wideEventContext,
        });
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - start;
        const statusCode = this.getErrorStatusCode(response, error);

        this.logWideEvent({
          request,
          response,
          responseBody: undefined,
          statusCode,
          duration,
          traceId,
          requestId,
          success: false,
          error,
          wideEventContext,
        });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Emit a single, rich structured log event with all relevant context
   */
  private logWideEvent(params: {
    request: Request;
    response: Response;
    responseBody: unknown;
    statusCode: number;
    duration: number;
    traceId: string;
    requestId: string;
    success: boolean;
    error?: unknown;
    wideEventContext: WideEventContext;
  }): void {
    const {
      request,
      response,
      responseBody,
      statusCode,
      duration,
      traceId,
      requestId,
      success,
      error,
      wideEventContext,
    } = params;

    // Build the wide event with comprehensive context
    const wideEvent: WideEventLog = {
      // Correlation & Timing
      timestamp: new Date().toISOString(),
      traceId,
      requestId,
      durationMs: duration,

      // HTTP Context
      method: request.method,
      url: request.url,
      path: request.path,
      statusCode,
      statusCategory: this.getStatusCategory(statusCode),

      // User Context (sanitized)
      user: {
        id: request.user?.userId || null,
        email: request.user?.email || null,
        name: request.user?.name || null,
      },

      // Request Details (sanitized)
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
      params:
        Object.keys(request.params).length > 0 ? request.params : undefined,

      // Response Context (sanitized)
      response: this.sanitizeResponse(responseBody, response),

      // Success & Error Context
      success,
      error: error ? this.sanitizeError(error) : undefined,

      // Application Telemetry (accumulated during request)
      database:
        wideEventContext.database &&
        wideEventContext.database.numCalls > 0
          ? wideEventContext.database
          : undefined,
      cache:
        wideEventContext.cache &&
        (wideEventContext.cache.hits > 0 || wideEventContext.cache.misses > 0)
          ? wideEventContext.cache
          : undefined,
      externalCalls:
        wideEventContext.externalCalls &&
        wideEventContext.externalCalls.length > 0
          ? wideEventContext.externalCalls
          : undefined,
      business: wideEventContext.business,
      featureFlags: wideEventContext.featureFlags,
      metadata: wideEventContext.metadata,

      // Infrastructure Context
      eventType: 'http_request',
      environment: process.env.NODE_ENV || 'development',
      service: 'yardvark-api',
    };

    // Emit structured log
    const logMethod = success ? 'log' : 'error';
    const emoji = this.getStatusEmoji(statusCode);
    const userName = request.user?.name || 'anonymous';

    // Human-readable summary + machine-readable JSON
    const summary = this.formatLogSummary(
      emoji,
      request.method,
      request.path,
      statusCode,
      duration,
      userName,
    );

    this.logger[logMethod](`${summary}\n${JSON.stringify(wideEvent, null, 2)}`);
  }

  /**
   * Format a human-readable log summary line
   */
  private formatLogSummary(
    emoji: string,
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    userName: string,
  ): string {
    return `${emoji} ${method} ${path} ${statusCode} ${durationMs}ms [${userName}]`;
  }

  private getOrCreateTraceId(request: Request): string {
    // Check for existing trace ID from headers (e.g., from API gateway or load balancer)
    const existingTraceId =
      request.headers['x-trace-id'] ||
      request.headers['x-request-id'] ||
      request.headers['x-correlation-id'];

    return (existingTraceId as string) || randomUUID();
  }

  private getClientIp(request: Request): string | undefined {
    // Handle various proxy scenarios
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress;
  }

  private getStatusCategory(
    statusCode: number,
  ): WideEventLog['statusCategory'] {
    if (statusCode >= 500) return 'server_error';
    if (statusCode >= 400) return 'client_error';
    if (statusCode >= 300) return 'redirect';
    return 'success';
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) return '🔥';
    if (statusCode >= 400) return '⚠️';
    if (statusCode >= 300) return '↪️';
    return '✅';
  }

  private getErrorStatusCode(
    response: { statusCode: number },
    err: unknown,
  ): number {
    return (
      response.statusCode ??
      (err instanceof HttpException ? err.getStatus() : 500)
    );
  }

  /**
   * Sanitize response data for logging
   * Prevents logging of sensitive information while keeping useful debugging data
   */
  private sanitizeResponse(
    body: unknown,
    response: Response,
  ): WideEventLog['response'] {
    if (!body) {
      return undefined;
    }

    const contentType = response.getHeader('content-type') as string;
    const contentLength = response.getHeader('content-length');

    // Don't log large responses
    const MAX_BODY_SIZE = 10000; // 10KB
    let sanitizedBody: unknown;

    try {
      const bodyStr = JSON.stringify(body);
      if (bodyStr.length > MAX_BODY_SIZE) {
        sanitizedBody = { _truncated: true, _size: bodyStr.length };
      } else {
        // For arrays, just include count and first few items
        if (Array.isArray(body)) {
          sanitizedBody = {
            _type: 'array',
            count: body.length,
            sample: body.slice(0, 3),
          };
        } else if (typeof body === 'object' && body !== null) {
          // For objects, include but mark as redacted if contains common sensitive field names
          const sensitiveFields = [
            'password',
            'token',
            'secret',
            'apiKey',
            'creditCard',
            'ssn',
          ];
          const redacted = this.redactSensitiveFields(body, sensitiveFields);
          sanitizedBody = redacted;
        } else {
          sanitizedBody = body;
        }
      }
    } catch {
      sanitizedBody = { _error: 'Failed to serialize response body' };
    }

    return {
      body: sanitizedBody,
      contentType,
      size: contentLength ? parseInt(contentLength as string, 10) : undefined,
    };
  }

  /**
   * Recursively redact sensitive fields from an object
   */
  private redactSensitiveFields(
    obj: any,
    sensitiveFields: string[],
  ): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitiveFields(item, sensitiveFields));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.redactSensitiveFields(value, sensitiveFields);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Sanitize error information to avoid leaking sensitive internal details
   * Only expose what's necessary for debugging
   */
  private sanitizeError(err: unknown): WideEventLog['error'] {
    let message = 'Unknown error';
    let type = 'Error';
    let code: string | undefined;
    let stack: string | undefined;

    if (err instanceof HttpException) {
      message = err.message;
      type = err.constructor.name;
      code = String(err.getStatus());
      // Include stack trace only in non-production
      if (process.env.NODE_ENV !== 'production') {
        stack = err.stack;
      }
    } else if (err instanceof Error) {
      message = err.message;
      type = err.constructor.name;
      if (process.env.NODE_ENV !== 'production') {
        stack = err.stack;
      }
    } else if (typeof err === 'string') {
      message = err;
    }

    return { message, type, code, stack };
  }
}
