# Wide Events Logging Pattern

## Overview

Yardvark's backend implements the **"Wide Events"** or **"Canonical Log Lines"** logging pattern, as advocated by [loggingsucks.com](https://loggingsucks.com/). This modern approach to logging emits **one rich, structured log entry per request** that accumulates comprehensive telemetry throughout the request lifecycle.

## Why Wide Events?

Traditional logging practices produce fragmented diary-style logs that are:
- ❌ Hard to search and correlate across services
- ❌ Missing vital context when debugging
- ❌ Difficult to analyze and query
- ❌ Optimized for writing, not reading
- ❌ Don't capture application-level telemetry (DB calls, cache, etc.)

Wide events solve these problems by:
- ✅ Emitting a single structured log with ALL relevant context
- ✅ Including correlation IDs for distributed tracing
- ✅ Using machine-readable JSON format
- ✅ Capturing business-relevant metadata alongside technical details
- ✅ Accumulating application telemetry (database, cache, external APIs)
- ✅ Including response data (sanitized) for complete request picture
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
  
  // Response Context
  response?: {
    body?: unknown;              // Response body (sanitized, truncated if large)
    contentType?: string;        // Response content type
    size?: number;               // Response size in bytes
  };
  
  // Response & Error Context
  success: boolean;              // Whether request succeeded
  error?: {                      // Only present on errors
    message: string;             // Sanitized error message
    type: string;                // Error type/class
    code?: string;               // Error code (if applicable)
    stack?: string;              // Stack trace (non-production only)
  };
  
  // Application Telemetry (accumulated during request)
  database?: {
    numCalls: number;            // Total database queries
    numFailures: number;         // Failed queries
    totalDurationMs?: number;    // Total time spent in DB
    slowestQueryMs?: number;     // Slowest query duration
  };
  
  cache?: {
    hits: number;                // Cache hits
    misses: number;              // Cache misses
  };
  
  externalCalls?: Array<{        // External API calls
    service: string;             // Service name
    durationMs: number;          // Call duration
    success: boolean;            // Whether call succeeded
    statusCode?: number;         // HTTP status code
  }>;
  
  business?: Record<string, unknown>;     // Business/domain context
  featureFlags?: Record<string, boolean>; // Feature flags in use
  metadata?: Record<string, unknown>;     // Custom metadata
  
  // Infrastructure Context
  eventType: 'http_request';     // Type of event
  environment: string;           // Runtime environment
  service: string;               // Service name
}
```

## Example Logs

### Successful Request with Full Telemetry
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
  "response": {
    "body": {
      "id": "entry-789",
      "activity": "mowing",
      "success": true
    },
    "contentType": "application/json",
    "size": 145
  },
  "database": {
    "numCalls": 3,
    "numFailures": 0,
    "totalDurationMs": 67,
    "slowestQueryMs": 34
  },
  "cache": {
    "hits": 2,
    "misses": 1
  },
  "business": {
    "lawnSegmentId": "segment-456",
    "activityType": "maintenance"
  },
  "success": true,
  "eventType": "http_request",
  "environment": "production",
  "service": "yardvark-api"
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

The logger sanitizes error information and response bodies to prevent leaking sensitive internal details:
- **Stack traces**: Only included in non-production environments
- **Response bodies**: Truncated if large, sensitive fields redacted
- **Sensitive field detection**: Automatic redaction of fields containing password, token, secret, apiKey, creditCard, ssn
- **Error sanitization**: Only error message, type, and code are logged
- **Sensitive data**: Should be avoided at the source

## Implementation

### Basic Setup

The `LoggingInterceptor` is automatically applied to all HTTP requests via NestJS interceptor pattern. No code changes are needed in individual controllers.

```typescript
// Automatically configured in main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
```

### Enriching Wide Event Context

Services can enrich the wide event with application telemetry using the `WideEventHelpers`:

```typescript
import { WideEventHelpers } from 'src/logger/wide-event.helpers';

// In your service
@Injectable()
export class EntriesService {
  async createEntry(userId: string, data: EntryData, request: Request) {
    // Add business context
    WideEventHelpers.addBusinessContext(request, 'activityType', data.activity);
    
    // Database operation with automatic telemetry
    const entry = await WideEventHelpers.withDatabaseTelemetry(
      request,
      () => this.repository.save(data)
    );
    
    // Record cache operations
    const cached = await this.cache.get(key);
    if (cached) {
      WideEventHelpers.recordCacheHit(request);
    } else {
      WideEventHelpers.recordCacheMiss(request);
    }
    
    // External API call with telemetry
    await WideEventHelpers.withExternalCallTelemetry(
      request,
      'weather-api',
      () => this.weatherService.getForecast(location)
    );
    
    // Feature flags
    if (this.featureService.isEnabled('new-entry-flow')) {
      WideEventHelpers.recordFeatureFlag(request, 'new-entry-flow', true);
    }
    
    return entry;
  }
}
```

### Available Helper Methods

- `recordDatabaseCall(request, durationMs, failed)` - Track database queries
- `recordCacheHit(request)` - Record cache hit
- `recordCacheMiss(request)` - Record cache miss
- `recordExternalCall(request, service, durationMs, success, statusCode)` - Track external API calls
- `addBusinessContext(request, key, value)` - Add domain-specific data
- `recordFeatureFlag(request, flagName, enabled)` - Track feature flag usage
- `addMetadata(request, key, value)` - Add custom metadata
- `withDatabaseTelemetry(request, operation)` - Wrap DB operation with auto-telemetry
- `withExternalCallTelemetry(request, serviceName, operation)` - Wrap API call with auto-telemetry

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

- [Logging Sucks - Your Logs Are Lying To You](https://loggingsucks.com/) - Original article advocating for wide events
- [Wide Events Logging Best Practices - Honeycomb](https://www.honeycomb.io/blog/engineers-checklist-logging-best-practices) - Engineering guide to structured logging
- [Structured Logging Best Practices - Better Stack](https://betterstack.com/community/guides/logging/logging-best-practices/) - Comprehensive guide to modern logging
- [Observability Engineering - O'Reilly](https://www.oreilly.com/library/view/observability-engineering/9781492076438/) - Deep dive into observability patterns
