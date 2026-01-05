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
 */

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

  // Response & Error Context
  success: boolean;
  error?: {
    message: string;
    type: string;
    code?: string;
  };

  // Business Context
  eventType: 'http_request';
  environment: string;
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

    // Attach IDs to request for downstream use
    (request as any).traceId = traceId;
    (request as any).requestId = requestId;

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;

        this.logWideEvent({
          request,
          statusCode,
          duration,
          traceId,
          requestId,
          success: true,
        });
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - start;
        const statusCode = this.getErrorStatusCode(response, error);

        this.logWideEvent({
          request,
          statusCode,
          duration,
          traceId,
          requestId,
          success: false,
          error,
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
    statusCode: number;
    duration: number;
    traceId: string;
    requestId: string;
    success: boolean;
    error?: unknown;
  }): void {
    const {
      request,
      statusCode,
      duration,
      traceId,
      requestId,
      success,
      error,
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

      // Response & Error Context
      success,
      error: error ? this.sanitizeError(error) : undefined,

      // Business Context
      eventType: 'http_request',
      environment: process.env.NODE_ENV || 'development',
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
   * Sanitize error information to avoid leaking sensitive internal details
   * Only expose what's necessary for debugging
   */
  private sanitizeError(err: unknown): WideEventLog['error'] {
    let message = 'Unknown error';
    let type = 'Error';
    let code: string | undefined;

    if (err instanceof HttpException) {
      message = err.message;
      type = err.constructor.name;
      code = String(err.getStatus());
    } else if (err instanceof Error) {
      message = err.message;
      type = err.constructor.name;
    } else if (typeof err === 'string') {
      message = err;
    }

    return { message, type, code };
  }
}
