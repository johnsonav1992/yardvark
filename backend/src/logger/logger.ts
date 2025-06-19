import {
	type CallHandler,
	type ExecutionContext,
	HttpException,
	Injectable,
	Logger,
	type NestInterceptor,
	Scope
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ scope: Scope.REQUEST })
export class LoggingInterceptor implements NestInterceptor {
	private logger = new Logger('HTTP');

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const httpContext = context.switchToHttp();
		const request = httpContext.getRequest<Request>();
		const response = httpContext.getResponse<Response>();

		const start = Date.now();

		return next.handle().pipe(
			tap(() => {
				const duration = Date.now() - start;
				const statusCode = response.statusCode;

				this.logSuccess({ statusCode, duration, request });
			}),
			catchError((error: unknown) => {
				const duration = Date.now() - start;
				const statusCode = this.getErrorStatusCode(response, error);

				this.logError({ statusCode, duration, request, error });

				return throwError(() => error);
			})
		);
	}

	private logSuccess(params: {
		request: Request;
		statusCode: number;
		duration: number;
	}): void {
		const statusEmoji = this.getStatusEmoji(params.statusCode);
		const userName = params.request.user?.name || 'Unknown';

		let logMessage =
			`${statusEmoji} ` +
			`[${params.request.method}] ` +
			`${params.request.url} ` +
			`${params.statusCode} - ${params.duration}ms ` +
			`- 👤 ${userName}`;

		if (this.hasBody(params.request.body))
			logMessage += `\n📦 Body: ${JSON.stringify(params.request.body, null, 2)}`;

		this.logger.log(logMessage);
	}

	private logError(params: {
		request: Request;
		statusCode: number;
		duration: number;
		error: unknown;
	}): void {
		const { errorMessage, stack } = this.extractErrorDetails(params.error);
		const statusEmoji = this.getStatusEmoji(params.statusCode);
		const userName = params.request.user?.name || 'Unknown';

		let errorLog =
			`${statusEmoji} ` +
			`[${params.request.method}] ` +
			`${params.request.url} ` +
			`${params.statusCode} - ${params.duration}ms ` +
			`- 👤 ${userName}\n`;

		if (this.hasBody(params.request.body))
			errorLog += `📦 Body: ${JSON.stringify(params.request.body, null, 2)}\n`;

		errorLog += `🚫 Error Message: ${errorMessage}\n`;

		if (stack) errorLog += `🔍 Stack Trace:\n${stack}`;

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
		err: unknown
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
