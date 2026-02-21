import { randomUUID } from "node:crypto";
import {
	type CallHandler,
	type ExecutionContext,
	HttpException,
	Injectable,
	type NestInterceptor,
	Scope,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import {
	context as otelContext,
	SpanStatusCode,
	trace,
} from "@opentelemetry/api";
import type { Request, Response } from "express";
import { from, Observable, of, throwError } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";
import type { SubscriptionService } from "../modules/subscription/services/subscription.service";
import type { GqlContext } from "../types/gql-context";
import {
	TAIL_SAMPLING_ENABLED,
	TAIL_SAMPLING_SLOW_THRESHOLD_MS,
	TAIL_SAMPLING_SUCCESS_RATE,
} from "./logger.constants";
import { type RequestContext, requestContext } from "./logger.context";
import { LogHelpers } from "./logger.helpers";
import type { HttpLogEntry, LogContext } from "./logger.types";
import { BusinessContextKeys } from "./logger-keys.constants";
import { logToOTel } from "./otel.transport";

export { getLogContext, getRequestContext } from "./logger.context";
export { LogContext, WideEventContext } from "./logger.types";

@Injectable({ scope: Scope.REQUEST })
export class LoggingInterceptor implements NestInterceptor {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	private getOperationLabel(
		gqlOperationName: string | undefined,
		gqlOperationType: string | undefined,
		request: Request,
	): string {
		if (!gqlOperationName || !gqlOperationType) {
			return `${request.method} ${request.path}`;
		}

		const isDefaultOperationName =
			gqlOperationName.toLowerCase() === gqlOperationType.toLowerCase();

		if (isDefaultOperationName) {
			return `${gqlOperationType} (anonymous)`;
		}

		return `${gqlOperationType} ${gqlOperationName}`;
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		let request: Request;
		let response: Response | undefined;
		let gqlOperationName: string | undefined;
		let gqlOperationType: string | undefined;

		if (context.getType() === "http") {
			const httpContext = context.switchToHttp();
			request = httpContext.getRequest<Request>();
			response = httpContext.getResponse<Response>();
		} else {
			const gqlContext = GqlExecutionContext.create(context);
			const ctx = gqlContext.getContext<GqlContext>();

			request = ctx.req;
			response = ctx.req?.res;

			const info = gqlContext.getInfo();

			if (info) {
				gqlOperationName = info.operation.name?.value;
				gqlOperationType = info.operation.operation;
			}
		}

		if (!request) {
			return next.handle();
		}

		const requestId = randomUUID();

		const logContext: LogContext = {
			database: { numCalls: 0, numFailures: 0 },
			cache: { hits: 0, misses: 0 },
			externalCalls: [],
		};

		const operationLabel = this.getOperationLabel(
			gqlOperationName,
			gqlOperationType,
			request,
		);

		const tracer = trace.getTracer("yardvark-api");
		const span = tracer.startSpan(operationLabel, {
			attributes: {
				"http.method": request.method,
				"http.url": request.url,
				"http.target": request.path,
				"http.user_agent": request.headers["user-agent"],
				"custom.request_id": requestId,
				...(gqlOperationName && { "graphql.operation.name": gqlOperationName }),
				...(gqlOperationType && {
					"graphql.operation.type": gqlOperationType,
				}),
			},
		});

		const traceId = span.spanContext().traceId;
		const reqContext: RequestContext = { traceId, requestId, logContext };

		const start = Date.now();

		const loadSubscriptionContext$ = request.user?.userId
			? from(
					this.subscriptionService.getOrCreateSubscription(request.user.userId),
				).pipe(
					tap((result) => {
						if (result.isError()) {
							LogHelpers.addBusinessContext(
								BusinessContextKeys.subscriptionFetchError,
								true,
							);

							return;
						}

						const subscription = result.value;

						LogHelpers.addBusinessContext(
							BusinessContextKeys.subscriptionTier,
							subscription.tier,
						);
						LogHelpers.addBusinessContext(
							BusinessContextKeys.subscriptionStatus,
							subscription.status,
						);
						LogHelpers.addBusinessContext(
							BusinessContextKeys.isPro,
							subscription.tier === "monthly" ||
								subscription.tier === "yearly" ||
								subscription.tier === "lifetime",
						);

						if (subscription.currentPeriodStart) {
							const daysSinceSubscription = Math.floor(
								(Date.now() -
									new Date(subscription.currentPeriodStart).getTime()) /
									(1000 * 60 * 60 * 24),
							);
							LogHelpers.addBusinessContext(
								BusinessContextKeys.subscriptionDaysActive,
								daysSinceSubscription,
							);
						}

						if (subscription.tier === "lifetime") {
							const daysSinceCreation = Math.floor(
								(Date.now() - new Date(subscription.createdAt).getTime()) /
									(1000 * 60 * 60 * 24),
							);
							LogHelpers.addBusinessContext(
								BusinessContextKeys.lifetimeSubscriptionAgeDays,
								daysSinceCreation,
							);
						}

						if (subscription.cancelAtPeriodEnd) {
							LogHelpers.addBusinessContext(
								BusinessContextKeys.subscriptionCanceling,
								true,
							);
						}
					}),
					catchError(() => {
						LogHelpers.addBusinessContext(
							BusinessContextKeys.subscriptionFetchError,
							true,
						);
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
										const statusCode = response?.statusCode ?? 200;

										span.setAttributes({
											"http.status_code": statusCode,
											"http.response_time_ms": duration,
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
												gqlOperationName,
												gqlOperationType,
											});
										}
									}),
									catchError((error: unknown) => {
										const duration = Date.now() - start;
										const statusCode = this.getErrorStatusCode(response, error);

										span.setAttributes({
											"http.status_code": statusCode,
											"http.response_time_ms": duration,
										});
										span.setStatus({
											code: SpanStatusCode.ERROR,
											message:
												error instanceof Error
													? error.message
													: "Unknown error",
										});
										span.recordException(
											error instanceof Error ? error : new Error(String(error)),
										);
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
											gqlOperationName,
											gqlOperationType,
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
		gqlOperationName?: string;
		gqlOperationType?: string;
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
			gqlOperationName,
			gqlOperationType,
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
			userAgent: request.headers["user-agent"],
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
			eventType: "http_request",
			environment: process.env.NODE_ENV || "development",
			service: "yardvark-api",
			...(gqlOperationName && { graphqlOperation: gqlOperationName }),
			...(gqlOperationType && { graphqlOperationType: gqlOperationType }),
		};

		const emoji = this.getStatusEmoji(statusCode);
		const userName = request.user?.name || "anonymous";

		const operationLabel = this.getOperationLabel(
			gqlOperationName,
			gqlOperationType,
			request,
		);

		const summary = `${emoji} ${operationLabel} ${statusCode} ${duration}ms [${userName}]`;

		logToOTel(
			success ? "info" : "error",
			summary,
			logEntry as unknown as Record<string, unknown>,
		);
	}

	private getClientIp(request: Request): string | undefined {
		const forwarded = request.headers["x-forwarded-for"];

		if (forwarded) {
			return (forwarded as string).split(",")[0].trim();
		}

		return request.ip || request.socket.remoteAddress;
	}

	private getStatusCategory(
		statusCode: number,
	): HttpLogEntry["statusCategory"] {
		if (statusCode >= 500) return "server_error";
		if (statusCode >= 400) return "client_error";
		if (statusCode >= 300) return "redirect";

		return "success";
	}

	private getStatusEmoji(statusCode: number): string {
		if (statusCode >= 500) return "🔥";
		if (statusCode >= 400) return "⚠️";
		if (statusCode >= 300) return "↪️";

		return "✅";
	}

	private getErrorStatusCode(
		response: { statusCode: number } | undefined,
		err: unknown,
	): number {
		if (err instanceof HttpException) {
			return err.getStatus();
		}

		if (!response) {
			return 500;
		}

		return response.statusCode >= 400 ? response.statusCode : 500;
	}

	private sanitizeError(err: unknown): HttpLogEntry["error"] {
		let message = "Unknown error";
		let type = "Error";
		let code: string | undefined;
		let stack: string | undefined;

		if (err instanceof HttpException) {
			message = err.message;
			type = err.constructor.name;
			code = String(err.getStatus());

			if (process.env.NODE_ENV !== "production") {
				stack = err.stack;
			}
		} else if (err instanceof Error) {
			message = err.message;
			type = err.constructor.name;

			if (process.env.NODE_ENV !== "production") {
				stack = err.stack;
			}
		} else if (typeof err === "string") {
			message = err;
		}

		return { message, type, code, stack };
	}
}
