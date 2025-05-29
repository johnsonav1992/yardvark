import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<{
      method: string;
      url: string;
      body: unknown;
      headers: Record<string, any>;
    }>();
    const response = httpContext.getResponse<{ statusCode: number }>();

    const { method, url, body } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;

        this.logSuccess({ method, url, statusCode, duration, body });
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - start;
        const statusCode = this.getErrorStatusCode(response, error);

        this.logError({ method, url, statusCode, duration, body, error });

        return throwError(() => error);
      }),
    );
  }

  private logSuccess(params: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    body: unknown;
  }): void {
    const statusEmoji = this.getStatusEmoji(params.statusCode);
    let logMessage = `${statusEmoji} [${params.method}] ${params.url} ${params.statusCode} - ${params.duration}ms`;

    if (this.hasBody(params.body)) {
      logMessage += `\n📦 Body: ${JSON.stringify(params.body, null, 2)}`;
    }

    this.logger.log(logMessage);
  }

  private logError(params: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    body: unknown;
    error: unknown;
  }): void {
    const { errorMessage, stack } = this.extractErrorDetails(params.error);

    let errorLog = `❌ [${params.method}] ${params.url} ${params.statusCode} - ${params.duration}ms\n`;

    if (this.hasBody(params.body)) {
      errorLog += `📦 Body: ${JSON.stringify(params.body, null, 2)}\n`;
    }

    errorLog += `🚫 Error Message: ${errorMessage}\n`;

    if (stack) {
      errorLog += `🔍 Stack Trace:\n${stack}`;
    }

    this.logger.error(errorLog);
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) return '🔥';
    if (statusCode >= 400) return '⚠️';
    if (statusCode >= 300) return '↪️';
    return '✅';
  }

  private hasBody(body: unknown): boolean {
    return !!body && Object.keys(body as object).length > 0;
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

  private extractErrorDetails(err: unknown): {
    errorMessage: string;
    stack: string;
  } {
    let errorMessage = 'Unknown error';
    let stack = '';

    if (err instanceof Error) {
      errorMessage = err.message;
      stack = err.stack ?? '';
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    return { errorMessage, stack };
  }
}
