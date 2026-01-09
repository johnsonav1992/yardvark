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
import { LogContext, HttpLogEntry } from './logger.types';
import {
  MAX_RESPONSE_BODY_SIZE,
  TAIL_SAMPLING_ENABLED,
  TAIL_SAMPLING_SUCCESS_RATE,
  TAIL_SAMPLING_SLOW_THRESHOLD_MS,
  SENSITIVE_FIELDS,
} from './logger.constants';
import { requestContext, RequestContext } from './logger.context';

export { LogContext, WideEventContext } from './logger.types';
export { getLogContext, getRequestContext } from './logger.context';

@Injectable({ scope: Scope.REQUEST })
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

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
    let responseBody: unknown;

    return new Observable((subscriber) => {
      requestContext.run(reqContext, () => {
        next
          .handle()
          .pipe(
            tap((body) => {
              const duration = Date.now() - start;
              const statusCode = response.statusCode;
              responseBody = body;

              if (this.shouldLogRequest(statusCode, duration, true)) {
                this.logHttpRequest({
                  request,
                  response,
                  responseBody,
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
                response,
                responseBody: undefined,
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
    response: Response;
    responseBody: unknown;
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
      response,
      responseBody,
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
      response: this.sanitizeResponse(responseBody, response),
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

    const logMethod = success ? 'log' : 'error';
    const emoji = this.getStatusEmoji(statusCode);
    const userName = request.user?.name || 'anonymous';

    const summary = `${emoji} ${request.method} ${request.path} ${statusCode} ${duration}ms [${userName}]`;

    this.logger[logMethod](`${summary}\n${JSON.stringify(logEntry, null, 2)}`);
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

  private sanitizeResponse(
    body: unknown,
    response: Response,
  ): HttpLogEntry['response'] {
    if (!body) {
      return undefined;
    }

    const contentType = response.getHeader('content-type') as string;
    const contentLength = response.getHeader('content-length');

    let sanitizedBody: unknown;

    try {
      const bodyStr = JSON.stringify(body);

      if (bodyStr.length > MAX_RESPONSE_BODY_SIZE) {
        sanitizedBody = { _truncated: true, _size: bodyStr.length };
      } else if (Array.isArray(body)) {
        sanitizedBody = {
          _type: 'array',
          count: body.length,
          sample: body.slice(0, 3),
        };
      } else if (typeof body === 'object' && body !== null) {
        sanitizedBody = this.redactSensitiveFields(body, SENSITIVE_FIELDS);
      } else {
        sanitizedBody = body;
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

  private redactSensitiveFields<T>(obj: T, sensitiveFields: string[]): T {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item: unknown) =>
        this.redactSensitiveFields(item, sensitiveFields),
      ) as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))
      ) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.redactSensitiveFields(value, sensitiveFields);
      } else {
        result[key] = value;
      }
    }
    return result as T;
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
