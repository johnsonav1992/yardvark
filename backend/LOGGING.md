# Wide Events Logging Pattern

## Overview

Yardvark's backend implements the **"Wide Events"** or **"Canonical Log Lines"** logging pattern, as advocated by [loggingsucks.com](https://loggingsucks.com/). This modern approach to logging emits **one rich, structured log entry per request** instead of multiple fragmented log messages.

## Why Wide Events?

Traditional logging practices produce fragmented diary-style logs that are:
- ❌ Hard to search and correlate across services
- ❌ Missing vital context when debugging
- ❌ Difficult to analyze and query
- ❌ Optimized for writing, not reading

Wide events solve these problems by:
- ✅ Emitting a single structured log with ALL relevant context
- ✅ Including correlation IDs for distributed tracing
- ✅ Using machine-readable JSON format
- ✅ Capturing business-relevant metadata alongside technical details
- ✅ Sanitizing sensitive data to prevent security leaks

## Log Structure

Each request generates a comprehensive log entry with the following structure:

```typescript
interface WideEventLog {
  // Correlation & Timing
  timestamp: string;              // ISO 8601 timestamp
  traceId: string;               // Correlation ID (from headers or generated)
  requestId: string;             // Unique ID for this specific request
  durationMs: number;            // Request processing time
  
  // HTTP Context
  method: string;                // HTTP method (GET, POST, etc.)
  url: string;                   // Full URL with query string
  path: string;                  // Path without query string
  statusCode: number;            // HTTP status code
  statusCategory: 'success' | 'redirect' | 'client_error' | 'server_error';
  
  // User Context
  user: {
    id: string | null;           // User ID (null for anonymous)
    email: string | null;        // User email
    name: string | null;         // User display name
  };
  
  // Request Details
  userAgent?: string;            // Client user agent
  ip?: string;                   // Client IP address
  query?: Record<string, unknown>; // Query parameters
  params?: Record<string, unknown>; // URL parameters
  
  // Response & Error Context
  success: boolean;              // Whether request succeeded
  error?: {                      // Only present on errors
    message: string;             // Sanitized error message
    type: string;                // Error type/class
    code?: string;               // Error code (if applicable)
  };
  
  // Business Context
  eventType: 'http_request';     // Type of event (always http_request for now)
  environment: string;           // Runtime environment
}
```

## Example Logs

### Successful Request
```
✅ POST /entries 201 145ms [John Gardener]
{
  "timestamp": "2026-01-05T17:05:45.972Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requestId": "req-12345678-90ab-cdef-1234-567890abcdef",
  "durationMs": 145,
  "method": "POST",
  "url": "/entries",
  "path": "/entries",
  "statusCode": 201,
  "statusCategory": "success",
  "user": {
    "id": "user-abc123",
    "email": "john@example.com",
    "name": "John Gardener"
  },
  "success": true,
  "eventType": "http_request",
  "environment": "production"
}
```

### Error Request
```
⚠️ GET /entries 401 23ms [anonymous]
{
  "timestamp": "2026-01-05T17:05:45.972Z",
  "traceId": "x9y8z7w6-v5u4-3210-fedc-ba0987654321",
  "requestId": "req-87654321-09ba-fedc-4321-098765432fed",
  "durationMs": 23,
  "method": "GET",
  "url": "/entries?startDate=2024-01-01",
  "path": "/entries",
  "statusCode": 401,
  "statusCategory": "client_error",
  "user": { "id": null, "email": null, "name": null },
  "success": false,
  "error": {
    "message": "Unauthorized",
    "type": "HttpException",
    "code": "401"
  },
  "eventType": "http_request",
  "environment": "production"
}
```

## Correlation IDs

The logger automatically handles trace IDs for distributed tracing:

1. **Existing Trace ID**: Checks for `x-trace-id`, `x-request-id`, or `x-correlation-id` headers
2. **Generate New**: Creates a new UUID if no trace ID exists
3. **Attach to Request**: Makes trace/request IDs available downstream

This enables tracking requests across multiple services or API calls.

## Status Emojis

For quick visual identification in logs:
- ✅ **2xx**: Success
- ↪️ **3xx**: Redirect
- ⚠️ **4xx**: Client Error
- 🔥 **5xx**: Server Error

## Security

The logger sanitizes error information to prevent leaking sensitive internal details:
- Stack traces are NOT included in log output
- Only error message, type, and code are logged
- Sensitive data in error messages should be avoided at the source

## Implementation

The `LoggingInterceptor` is automatically applied to all HTTP requests via NestJS interceptor pattern. No code changes are needed in individual controllers.

```typescript
// Automatically configured in main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
```

## Querying Logs

Since logs are structured JSON, they can be easily queried using log aggregation tools:

```javascript
// Find all slow requests (>1000ms)
logs.filter(log => log.durationMs > 1000)

// Find all errors for a specific user
logs.filter(log => log.user.id === 'user-123' && !log.success)

// Track a request across services
logs.filter(log => log.traceId === 'a1b2c3d4-...')

// Find all 5xx errors
logs.filter(log => log.statusCategory === 'server_error')
```

## Best Practices

1. **Use trace IDs** from upstream services when available
2. **Monitor duration** to identify slow endpoints
3. **Aggregate by user** to understand customer impact
4. **Filter by statusCategory** for quick error detection
5. **Correlate with business metrics** using the structured data

## References

- [Logging Sucks - Your Logs Are Lying To You](https://loggingsucks.com/)
- [Wide Events Pattern](https://www.honeycomb.io/blog/engineers-checklist-logging-best-practices)
- [Structured Logging Best Practices](https://betterstack.com/community/guides/logging/logging-best-practices/)
