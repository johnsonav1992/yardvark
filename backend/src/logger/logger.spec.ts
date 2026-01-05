import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logger';
import { ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Request, Response } from 'express';

describe('LoggingInterceptor - Wide Events', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    // Use resolve() for REQUEST-scoped providers
    interceptor = await module.resolve<LoggingInterceptor>(LoggingInterceptor);

    mockRequest = {
      method: 'GET',
      url: '/test?query=value',
      path: '/test',
      headers: {
        'user-agent': 'test-agent',
      },
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
      query: { query: 'value' },
      params: {},
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    // Reset mockCallHandler to default success response each time
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({})),
    };
  });

  describe('Wide Event Structure', () => {
    it('should emit structured log with comprehensive context on success', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalled();
          const logCall = logSpy.mock.calls[0][0];

          // Should contain human-readable summary
          expect(logCall).toContain('✅');
          expect(logCall).toContain('GET');
          expect(logCall).toContain('/test');
          expect(logCall).toContain('Test User');

          // Should contain structured JSON
          expect(logCall).toContain('timestamp');
          expect(logCall).toContain('traceId');
          expect(logCall).toContain('requestId');
          expect(logCall).toContain('durationMs');

          done();
        },
      });
    });

    it('should include correlation IDs for distributed tracing', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);

          expect(jsonMatch).toBeTruthy();
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.traceId).toBeDefined();
          expect(logData.requestId).toBeDefined();
          expect(typeof logData.traceId).toBe('string');
          expect(typeof logData.requestId).toBe('string');

          done();
        },
      });
    });

    it('should capture comprehensive HTTP context', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.method).toBe('GET');
          expect(logData.url).toBe('/test?query=value');
          expect(logData.path).toBe('/test');
          expect(logData.statusCode).toBe(200);
          expect(logData.statusCategory).toBe('success');
          expect(logData.eventType).toBe('http_request');

          done();
        },
      });
    });

    it('should include user context when available', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.user).toEqual({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          });

          done();
        },
      });
    });

    it('should handle anonymous users gracefully', (done) => {
      mockRequest.user = undefined;
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.user).toEqual({
            id: null,
            email: null,
            name: null,
          });

          done();
        },
      });
    });

    it('should include request metadata (query, params, user agent)', (done) => {
      mockRequest.params = { id: '123' };
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.query).toEqual({ query: 'value' });
          expect(logData.params).toEqual({ id: '123' });
          expect(logData.userAgent).toBe('test-agent');
          expect(logData.ip).toBe('127.0.0.1');

          done();
        },
      });
    });

    it('should measure and include request duration', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.durationMs).toBeDefined();
          expect(typeof logData.durationMs).toBe('number');
          expect(logData.durationMs).toBeGreaterThanOrEqual(0);

          done();
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should emit structured error log with sanitized error details', (done) => {
      const error = new HttpException('Bad Request', 400);
      // Create fresh mock handler for this test
      const localCallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      };

      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      interceptor.intercept(mockExecutionContext, localCallHandler).subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalled();
          const logCall = errorSpy.mock.calls[0][0] as string;
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.success).toBe(false);
          expect(logData.error).toBeDefined();
          expect(logData.error.message).toBe('Bad Request');
          expect(logData.error.type).toBe('HttpException');
          expect(logData.error.code).toBe('400');
          expect(logData.statusCategory).toBe('client_error');

          done();
        },
      });
    });

    it('should sanitize error to avoid leaking internal details', (done) => {
      const error = new Error('Database connection failed: password=secret123');
      // Create fresh mock handler for this test
      const localCallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      };

      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      interceptor.intercept(mockExecutionContext, localCallHandler).subscribe({
        error: () => {
          const logCall = errorSpy.mock.calls[0][0] as string;
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          // Should have error info but sanitized (no stack trace in public log)
          expect(logData.error).toBeDefined();
          expect(logData.error.message).toBeDefined();
          expect(logData.error.type).toBe('Error');

          done();
        },
      });
    });
  });

  describe('Trace ID Handling', () => {
    it('should use existing trace ID from headers when available', (done) => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-trace-id': 'existing-trace-123',
      };

      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.traceId).toBe('existing-trace-123');

          done();
        },
      });
    });

    it('should generate new trace ID when not provided', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0];
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.traceId).toBeDefined();
          expect(typeof logData.traceId).toBe('string');
          expect(logData.traceId.length).toBeGreaterThan(0);

          done();
        },
      });
    });
  });

  describe('Status Categories', () => {
    it('should categorize 200 status as success', (done) => {
      mockResponse.statusCode = 200;
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0] as string;
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.statusCategory).toBe('success');
          expect(logCall).toContain('✅');

          done();
        },
      });
    });

    it('should categorize 301 status as redirect', (done) => {
      mockResponse.statusCode = 301;
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const logCall = logSpy.mock.calls[0][0] as string;
          const jsonMatch = logCall.match(/\{[\s\S]*\}/);
          const logData = JSON.parse(jsonMatch![0]);

          expect(logData.statusCategory).toBe('redirect');
          expect(logCall).toContain('↪️');

          done();
        },
      });
    });
  });
});
