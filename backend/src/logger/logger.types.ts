export interface LogContext {
  database?: {
    numCalls: number;
    numFailures: number;
    totalDurationMs?: number;
    slowestQueryMs?: number;
  };
  cache?: {
    hits: number;
    misses: number;
  };
  externalCalls?: Array<{
    service: string;
    durationMs: number;
    success: boolean;
    statusCode?: number;
  }>;
  business?: Record<string, unknown>;
  featureFlags?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
}

export interface HttpLogEntry {
  timestamp: string;
  traceId: string;
  requestId: string;
  durationMs: number;
  method: string;
  url: string;
  path: string;
  statusCode: number;
  statusCategory: 'success' | 'redirect' | 'client_error' | 'server_error';
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
  };
  userAgent?: string;
  ip?: string;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  response?: {
    body?: unknown;
    contentType?: string;
    size?: number;
  };
  success: boolean;
  error?: {
    message: string;
    type: string;
    code?: string;
    stack?: string;
  };
  database?: LogContext['database'];
  cache?: LogContext['cache'];
  externalCalls?: LogContext['externalCalls'];
  business?: LogContext['business'];
  featureFlags?: LogContext['featureFlags'];
  metadata?: LogContext['metadata'];
  eventType: 'http_request';
  environment: string;
  service: string;
}

/** @deprecated Use LogContext instead */
export type WideEventContext = LogContext;

/** @deprecated Use HttpLogEntry instead */
export type WideEventLog = HttpLogEntry;
