import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, tap, mergeMap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { LogContext, HttpLogEntry } from './logger.types';
import {
  TAIL_SAMPLING_ENABLED,
  TAIL_SAMPLING_SUCCESS_RATE,
  TAIL_SAMPLING_SLOW_THRESHOLD_MS,
} from './logger.constants';
import { requestContext, RequestContext } from './logger.context';
import { logToOTel } from './otel.transport';
import { SubscriptionService } from '../modules/subscription/services/subscription.service';
import { LogHelpers } from './logger.helpers';
import { trace, context as otelContext, SpanStatusCode } from '@opentelemetry/api';

export { LogContext, WideEventContext } from './logger.types';
export { getLogContext, getRequestContext } from './logger.context';

@Injectable({ scope: Scope.REQUEST })
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const requestId = randomUUID();

    const logContext: LogContext = {
      database: { numCalls: 0, numFailures: 0 },
      cache: { hits: 0, misses: 0 },
      externalCalls: [],
    };

    const tracer = trace.getTracer('yardvark-api');
    const span = tracer.startSpan(`${request.method} ${request.path}`, {
      attributes: {
        'http.method': request.method,
        'http.url': request.url,
        'http.target': request.path,
        'http.user_agent': request.headers['user-agent'],
        'custom.request_id': requestId,
      },
    });

    const traceId = span.spanContext().traceId;
    const reqContext: RequestContext = { traceId, requestId, logContext };

    const start = Date.now();

    const loadSubscriptionContext$ = request.user?.userId
      ? from(
          this.subscriptionService.getOrCreateSubscription(request.user.userId),
        ).pipe(
          tap((subscription) => {
            if (subscription) {
              LogHelpers.addBusinessContext(
                'subscription_tier',
                subscription.tier,
              );
              LogHelpers.addBusinessContext(
                'subscription_status',
                subscription.status,
              );
              LogHelpers.addBusinessContext(
                'is_pro',
                subscription.tier === 'monthly' ||
                  subscription.tier === 'yearly' ||
                  subscription.tier === 'lifetime',
              );

              if (subscription.currentPeriodStart) {
                const daysSinceSubscription = Math.floor(
                  (Date.now() -
                    new Date(subscription.currentPeriodStart).getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                LogHelpers.addBusinessContext(
                  'subscription_days_active',
                  daysSinceSubscription,
                );
              }

              if (subscription.tier === 'lifetime') {
                const daysSinceCreation = Math.floor(
                  (Date.now() - new Date(subscription.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                LogHelpers.addBusinessContext(
                  'lifetime_subscription_age_days',
                  daysSinceCreation,
                );
              }

              if (subscription.cancelAtPeriodEnd) {
                LogHelpers.addBusinessContext('subscription_canceling', true);
              }
            }
          }),
          catchError(() => {
            LogHelpers.addBusinessContext('subscription_fetch_error', true);
            return of(null);
          }),
        )
      : of(null);

    return new Observable((subscriber) => {
      const spanContext = trace.setSpan(otelContext.active(), span);

      requestContext.run(reqContext, () => {
        otelContext.with(spanContext, () => {
          loadSubscriptionContext$
            .pipe(
              mergeMap(() =>
                next.handle().pipe(
                  tap(() => {
                    const duration = Date.now() - start;
                    const statusCode = response.statusCode;

                    span.setAttributes({
                      'http.status_code': statusCode,
                      'http.response_time_ms': duration,
                    });
                    span.setStatus({ code: SpanStatusCode.OK });
                    span.end();

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

                    span.setAttributes({
                      'http.status_code': statusCode,
                      'http.response_time_ms': duration,
                    });
                    span.setStatus({
                      code: SpanStatusCode.ERROR,
                      message: error instanceof Error ? error.message : 'Unknown error',
                    });
                    span.recordException(error instanceof Error ? error : new Error(String(error)));
                    span.end();

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
                ),
              ),
            )
            .subscribe(subscriber);
        });
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
