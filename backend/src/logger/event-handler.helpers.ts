import { randomUUID } from "node:crypto";
import {
	context as otelContext,
	SpanStatusCode,
	trace,
} from "@opentelemetry/api";
import {
	TAIL_SAMPLING_ENABLED,
	TAIL_SAMPLING_SLOW_THRESHOLD_MS,
	TAIL_SAMPLING_SUCCESS_RATE,
} from "./logger.constants";
import { type RequestContext, requestContext } from "./logger.context";
import type { LogContext } from "./logger.types";
import { logToOTel } from "./otel.transport";

export class EventHandlerHelpers {
	static async withLoggingContext<T>(
		eventName: string,
		handler: () => Promise<T>,
	): Promise<T> {
		const requestId = randomUUID();

		const logContext: LogContext = {
			database: { numCalls: 0, numFailures: 0 },
			cache: { hits: 0, misses: 0 },
			externalCalls: [],
		};

		const tracer = trace.getTracer("yardvark-api");
		const span = tracer.startSpan(`event:${eventName}`, {
			attributes: {
				"custom.request_id": requestId,
				"custom.event_name": eventName,
			},
		});

		const traceId = span.spanContext().traceId;
		const reqContext: RequestContext = { traceId, requestId, logContext };
		const startTime = Date.now();

		try {
			const result = await requestContext.run(reqContext, async () => {
				return await otelContext.with(
					trace.setSpan(otelContext.active(), span),
					async () => {
						return await handler();
					},
				);
			});

			const duration = Date.now() - startTime;

			span.setStatus({ code: SpanStatusCode.OK });
			span.end();

			if (EventHandlerHelpers.shouldLogEvent(duration, true)) {
				EventHandlerHelpers.logEventExecution({
					eventName,
					traceId,
					requestId,
					duration,
					success: true,
					logContext,
				});
			}

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;

			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error instanceof Error ? error.message : "Unknown error",
			});
			span.recordException(
				error instanceof Error ? error : new Error(String(error)),
			);
			span.end();

			if (EventHandlerHelpers.shouldLogEvent(duration, false)) {
				EventHandlerHelpers.logEventExecution({
					eventName,
					traceId,
					requestId,
					duration,
					success: false,
					error,
					logContext,
				});
			}

			throw error;
		}
	}

	private static shouldLogEvent(durationMs: number, success: boolean): boolean {
		if (!TAIL_SAMPLING_ENABLED) return true;

		if (!success) return true;

		if (durationMs >= TAIL_SAMPLING_SLOW_THRESHOLD_MS) return true;

		return Math.random() < TAIL_SAMPLING_SUCCESS_RATE;
	}

	private static logEventExecution(params: {
		eventName: string;
		traceId: string;
		requestId: string;
		duration: number;
		success: boolean;
		error?: unknown;
		logContext: LogContext;
	}): void {
		const {
			eventName,
			traceId,
			requestId,
			duration,
			success,
			error,
			logContext,
		} = params;

		const logEntry = {
			timestamp: new Date().toISOString(),
			traceId,
			requestId,
			durationMs: duration,
			eventName,
			success,
			error: error
				? {
						message:
							error instanceof Error
								? error.message
								: typeof error === "string"
									? error
									: JSON.stringify(error),
						type: error instanceof Error ? error.constructor.name : "Error",
						stack:
							process.env.NODE_ENV !== "production" && error instanceof Error
								? error.stack
								: undefined,
					}
				: undefined,
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
			eventType: "event_handler",
			environment: process.env.NODE_ENV || "development",
			service: "yardvark-api",
		};

		const emoji = success ? "✅" : "🔥";
		const summary = `${emoji} EVENT ${eventName} ${duration}ms`;

		logToOTel(success ? "info" : "error", summary, logEntry);
	}
}
