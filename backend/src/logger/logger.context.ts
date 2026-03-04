import { AsyncLocalStorage } from "node:async_hooks";
import type { LogContext } from "./logger.types";

export interface RequestContext {
	traceId: string;
	requestId: string;
	logContext: LogContext;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
	return requestContext.getStore();
}

export function getLogContext(): LogContext | undefined {
	return requestContext.getStore()?.logContext;
}
