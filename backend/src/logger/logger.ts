import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { LogContext, HttpLogEntry } from './logger.types';
import {
  TAIL_SAMPLING_ENABLED,
  TAIL_SAMPLING_SUCCESS_RATE,
  TAIL_SAMPLING_SLOW_THRESHOLD_MS,
} from './logger.constants';
import { requestContext, RequestContext } from './logger.context';
import { logToOTel } from './otel.transport';

export { LogContext, WideEventContext } from './logger.types';
export { getLogContext, getRequestContext } from './logger.context';

@Injectable({ scope: Scope.REQUEST })
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const traceId = this.getOrCreateTraceId(request);
    const requestId = randomUUID();

    const logContext: LogContext = {
      database: { numCalls: 0, numFailures: 0 },
      cache: { hits: 0, misses: 0 },
      externalCalls: [],
    };

    const reqContext: RequestContext = { traceId, requestId, logContext };

    const start = Date.now();

    return new Observable((subscriber) => {
      requestContext.run(reqContext, () => {
        next
          .handle()
          .pipe(
            tap(() => {
              const duration = Date.now() - start;
              const statusCode = response.statusCode;

              if (this.shouldLogRequest(statusCode, duration, true)) {
                this.logHttpRequest({
                  request,
                  statusCode,
                  duration,
                  traceId,
                  requestId,
                  success: true,
                  logContext,
                });
              }
            }),
            catchError((error: unknown) => {
              const duration = Date.now() - start;
              const statusCode = this.getErrorStatusCode(response, error);

              this.logHttpRequest({
                request,
                statusCode,
                duration,
                traceId,
                requestId,
                success: false,
                error,
                logContext,
              });

              return throwError(() => error);
            }),
          )
          .subscribe(subscriber);
      });
    });
  }

  private shouldLogRequest(
    statusCode: number,
    durationMs: number,
    success: boolean,
  ): boolean {
    if (!TAIL_SAMPLING_ENABLED) {
      return true;
    }

    if (!success || statusCode >= 400) {
      return true;
    }

    if (durationMs >= TAIL_SAMPLING_SLOW_THRESHOLD_MS) {
      return true;
    }

    return Math.random() < TAIL_SAMPLING_SUCCESS_RATE;
  }

  private logHttpRequest(params: {
    request: Request;
    statusCode: number;
    duration: number;
    traceId: string;
    requestId: string;
    success: boolean;
    error?: unknown;
    logContext: LogContext;
  }): void {
    const {
      request,
      statusCode,
      duration,
      traceId,
      requestId,
      success,
      error,
      logContext,
    } = params;

    const logEntry: HttpLogEntry = {
      timestamp: new Date().toISOString(),
      traceId,
      requestId,
      durationMs: duration,
      method: request.method,
      url: request.url,
      path: request.path,
      statusCode,
      statusCategory: this.getStatusCategory(statusCode),
      user: {
        id: request.user?.userId || null,
        email: request.user?.email || null,
        name: request.user?.name || null,
      },
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
      params:
        Object.keys(request.params).length > 0 ? request.params : undefined,
      success,
      error: error ? this.sanitizeError(error) : undefined,
      database:
        logContext.database && logContext.database.numCalls > 0
          ? logContext.database
          : undefined,
      cache:
        logContext.cache &&
        (logContext.cache.hits > 0 || logContext.cache.misses > 0)
          ? logContext.cache
          : undefined,
      externalCalls:
        logContext.externalCalls && logContext.externalCalls.length > 0
          ? logContext.externalCalls
          : undefined,
      business: logContext.business,
      featureFlags: logContext.featureFlags,
      metadata: logContext.metadata,
      eventType: 'http_request',
      environment: process.env.NODE_ENV || 'development',
      service: 'yardvark-api',
    };

    const emoji = this.getStatusEmoji(statusCode);
    const userName = request.user?.name || 'anonymous';

    const summary = `${emoji} ${request.method} ${request.path} ${statusCode} ${duration}ms [${userName}]`;

    logToOTel(
      success ? 'info' : 'error',
      summary,
      logEntry as unknown as Record<string, unknown>,
    );
  }

  private getOrCreateTraceId(request: Request): string {
    const existingTraceId =
      request.headers['x-trace-id'] ||
      request.headers['x-request-id'] ||
      request.headers['x-correlation-id'];

    return (existingTraceId as string) || randomUUID();
  }

  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];

    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }

    return request.ip || request.socket.remoteAddress;
  }

  private getStatusCategory(
    statusCode: number,
  ): HttpLogEntry['statusCategory'] {
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

  private sanitizeError(err: unknown): HttpLogEntry['error'] {
    let message = 'Unknown error';
    let type = 'Error';
    let code: string | undefined;
    let stack: string | undefined;

    if (err instanceof HttpException) {
      message = err.message;
      type = err.constructor.name;
      code = String(err.getStatus());

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
