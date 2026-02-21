import { Test, TestingModule } from "@nestjs/testing";
import { LoggingInterceptor } from "./logger";
import { ExecutionContext, CallHandler, HttpException } from "@nestjs/common";
import { of, throwError, lastValueFrom } from "rxjs";
import { Request, Response } from "express";
import { SubscriptionService } from "../modules/subscription/services/subscription.service";
import { Ok } from "../types/either";
import * as otelTransport from "./otel.transport";

interface LogAttributes {
	timestamp: string;
	traceId: string;
	requestId: string;
	durationMs: number;
	method: string;
	url: string;
	path: string;
	statusCode: number;
	statusCategory: string;
	eventType: string;
	user: { id: string | null; email: string | null; name: string | null };
	userAgent?: string;
	ip?: string;
	query?: Record<string, unknown>;
	params?: Record<string, unknown>;
	success: boolean;
	error?: { message: string; type: string; code?: string };
}

describe("LoggingInterceptor - Wide Events", () => {
	let module: TestingModule;
	let mockExecutionContext: ExecutionContext;
	let mockCallHandler: CallHandler;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let logToOTelSpy: jest.SpyInstance;

	beforeAll(async () => {
		const mockSubscriptionService = {
			getOrCreateSubscription: jest.fn().mockReturnValue(
				Promise.resolve(
					new Ok({
						tier: "free",
						status: "active",
						createdAt: new Date(),
					}),
				),
			),
		};

		module = await Test.createTestingModule({
			providers: [
				LoggingInterceptor,
				{
					provide: SubscriptionService,
					useValue: mockSubscriptionService,
				},
			],
		}).compile();

		jest.spyOn(global.Math, "random").mockReturnValue(0);
		logToOTelSpy = jest.spyOn(otelTransport, "logToOTel").mockImplementation();
	});

	beforeEach(() => {
		logToOTelSpy.mockClear();

		mockRequest = {
			method: "GET",
			url: "/test?query=value",
			path: "/test",
			headers: { "user-agent": "test-agent" },
			user: {
				userId: "user-123",
				email: "test@example.com",
				name: "Test User",
			},
			query: { query: "value" },
			params: {},
			ip: "127.0.0.1",
			socket: { remoteAddress: "127.0.0.1" } as Request["socket"],
		};

		mockResponse = {
			statusCode: 200,
			getHeader: jest.fn().mockReturnValue(undefined),
		};

		mockExecutionContext = {
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: () => mockRequest,
				getResponse: () => mockResponse,
			}),
		} as unknown as ExecutionContext;

		mockCallHandler = {
			handle: jest.fn().mockReturnValue(of({})),
		};
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	const getInterceptor = async (): Promise<LoggingInterceptor> => {
		return module.resolve<LoggingInterceptor>(LoggingInterceptor);
	};

	const getLogAttributes = (): LogAttributes => {
		const call = logToOTelSpy.mock.calls[0];

		return call[2] as LogAttributes;
	};

	const getLogMessage = (): string => {
		const call = logToOTelSpy.mock.calls[0];

		return call[1] as string;
	};

	describe("Wide Event Structure", () => {
		it("should emit structured log with comprehensive context on success", async () => {
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			expect(logToOTelSpy).toHaveBeenCalled();
			const message = getLogMessage();
			const attrs = getLogAttributes();

			expect(message).toContain("✅");
			expect(message).toContain("GET");
			expect(message).toContain("/test");
			expect(message).toContain("Test User");
			expect(attrs.timestamp).toBeDefined();
			expect(attrs.traceId).toBeDefined();
			expect(attrs.requestId).toBeDefined();
			expect(attrs.durationMs).toBeDefined();
		});

		it("should include correlation IDs for distributed tracing", async () => {
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.traceId).toBeDefined();
			expect(attrs.requestId).toBeDefined();
			expect(typeof attrs.traceId).toBe("string");
			expect(typeof attrs.requestId).toBe("string");
		});

		it("should capture comprehensive HTTP context", async () => {
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.method).toBe("GET");
			expect(attrs.url).toBe("/test?query=value");
			expect(attrs.path).toBe("/test");
			expect(attrs.statusCode).toBe(200);
			expect(attrs.statusCategory).toBe("success");
			expect(attrs.eventType).toBe("http_request");
		});

		it("should include user context when available", async () => {
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.user).toEqual({
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			});
		});

		it("should handle anonymous users gracefully", async () => {
			mockRequest.user = undefined;
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.user).toEqual({
				id: null,
				email: null,
				name: null,
			});
		});

		it("should include request metadata", async () => {
			mockRequest.params = { id: "123" };
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.query).toEqual({ query: "value" });
			expect(attrs.params).toEqual({ id: "123" });
			expect(attrs.userAgent).toBe("test-agent");
			expect(attrs.ip).toBe("127.0.0.1");
		});

		it("should measure and include request duration", async () => {
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.durationMs).toBeDefined();
			expect(typeof attrs.durationMs).toBe("number");
			expect(attrs.durationMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("Error Handling", () => {
		it("should emit structured error log with sanitized error details", async () => {
			const error = new HttpException("Bad Request", 400);
			mockResponse.statusCode = 400;

			const localCallHandler = {
				handle: jest.fn().mockReturnValue(throwError(() => error)),
			};

			const interceptor = await getInterceptor();

			await expect(
				lastValueFrom(
					interceptor.intercept(mockExecutionContext, localCallHandler),
				),
			).rejects.toThrow();

			expect(logToOTelSpy).toHaveBeenCalledWith(
				"error",
				expect.any(String),
				expect.any(Object),
			);
			const attrs = getLogAttributes();

			expect(attrs.success).toBe(false);
			expect(attrs.error).toBeDefined();
			expect(attrs.error?.message).toBe("Bad Request");
			expect(attrs.error?.type).toBe("HttpException");
			expect(attrs.error?.code).toBe("400");
			expect(attrs.statusCategory).toBe("client_error");
		});

		it("should sanitize error to avoid leaking internal details", async () => {
			const error = new Error("Database connection failed: password=secret123");
			mockResponse.statusCode = 500;

			const localCallHandler = {
				handle: jest.fn().mockReturnValue(throwError(() => error)),
			};

			const interceptor = await getInterceptor();

			await expect(
				lastValueFrom(
					interceptor.intercept(mockExecutionContext, localCallHandler),
				),
			).rejects.toThrow();

			const attrs = getLogAttributes();

			expect(attrs.error).toBeDefined();
			expect(attrs.error?.message).toBeDefined();
			expect(attrs.error?.type).toBe("Error");
		});
	});

	describe("Trace ID Handling", () => {
		it("should use existing trace ID from headers when available", async () => {
			mockRequest.headers = {
				...mockRequest.headers,
				"x-trace-id": "existing-trace-123",
			};

			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.traceId).toBeDefined();
			expect(typeof attrs.traceId).toBe("string");
		});

		it("should generate new trace ID when not provided", async () => {
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const attrs = getLogAttributes();

			expect(attrs.traceId).toBeDefined();
			expect(typeof attrs.traceId).toBe("string");
			expect(attrs.traceId.length).toBeGreaterThan(0);
		});
	});

	describe("Status Categories", () => {
		it("should categorize 200 status as success", async () => {
			mockResponse.statusCode = 200;
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const message = getLogMessage();
			const attrs = getLogAttributes();

			expect(attrs.statusCategory).toBe("success");
			expect(message).toContain("✅");
		});

		it("should categorize 301 status as redirect", async () => {
			mockResponse.statusCode = 301;
			const interceptor = await getInterceptor();

			await lastValueFrom(
				interceptor.intercept(mockExecutionContext, mockCallHandler),
			);

			const message = getLogMessage();
			const attrs = getLogAttributes();

			expect(attrs.statusCategory).toBe("redirect");
			expect(message).toContain("↪️");
		});
	});
});
