import {
	ExternalServiceError,
	ResourceError,
	ResourceNotFound,
	ResourceValidationError,
} from "./resource-error";

describe("ResourceError", () => {
	describe("ResourceError base class", () => {
		it("should set message, code, and default statusCode to 500", () => {
			const error = new ResourceError({
				message: "Something went wrong",
				code: "INTERNAL_ERROR",
			});

			expect(error.message).toBe("Something went wrong");
			expect(error.code).toBe("INTERNAL_ERROR");
			expect(error.statusCode).toBe(500);
			expect(error.error).toBeUndefined();
		});

		it("should allow overriding statusCode", () => {
			const error = new ResourceError({
				message: "Conflict",
				code: "CONFLICT",
				statusCode: 409,
			});

			expect(error.statusCode).toBe(409);
		});

		it("should store the original error when provided", () => {
			const originalError = new Error("Original failure");

			const error = new ResourceError({
				message: "Wrapped error",
				code: "WRAPPED",
				error: originalError,
			});

			expect(error.error).toBe(originalError);
		});

		it("should store non-Error objects as the error property", () => {
			const unknownError = { detail: "something unexpected" };

			const error = new ResourceError({
				message: "Unknown error",
				code: "UNKNOWN",
				error: unknownError,
			});

			expect(error.error).toBe(unknownError);
		});
	});

	describe("ResourceNotFound", () => {
		it("should always set statusCode to 404", () => {
			const error = new ResourceNotFound({
				message: "User not found",
				code: "USER_NOT_FOUND",
			});

			expect(error.message).toBe("User not found");
			expect(error.code).toBe("USER_NOT_FOUND");
			expect(error.statusCode).toBe(404);
		});

		it("should be an instance of ResourceError", () => {
			const error = new ResourceNotFound({
				message: "Not found",
				code: "NOT_FOUND",
			});

			expect(error).toBeInstanceOf(ResourceError);
		});

		it("should store the original error when provided", () => {
			const originalError = new Error("DB lookup failed");

			const error = new ResourceNotFound({
				message: "Not found",
				code: "NOT_FOUND",
				error: originalError,
			});

			expect(error.error).toBe(originalError);
		});
	});

	describe("ExternalServiceError", () => {
		it("should default statusCode to 502", () => {
			const error = new ExternalServiceError({
				message: "Service unavailable",
				code: "SERVICE_DOWN",
			});

			expect(error.message).toBe("Service unavailable");
			expect(error.code).toBe("SERVICE_DOWN");
			expect(error.statusCode).toBe(502);
		});

		it("should allow overriding statusCode", () => {
			const error = new ExternalServiceError({
				message: "Gateway timeout",
				code: "GATEWAY_TIMEOUT",
				statusCode: 504,
			});

			expect(error.statusCode).toBe(504);
		});

		it("should be an instance of ResourceError", () => {
			const error = new ExternalServiceError({
				message: "External failure",
				code: "EXTERNAL_FAILURE",
			});

			expect(error).toBeInstanceOf(ResourceError);
		});

		it("should store the original error when provided", () => {
			const originalError = new Error("Timeout");

			const error = new ExternalServiceError({
				message: "External failure",
				code: "EXTERNAL_FAILURE",
				error: originalError,
			});

			expect(error.error).toBe(originalError);
		});
	});

	describe("ResourceValidationError", () => {
		it("should always set statusCode to 400", () => {
			const error = new ResourceValidationError({
				message: "Invalid input",
				code: "VALIDATION_FAILED",
			});

			expect(error.message).toBe("Invalid input");
			expect(error.code).toBe("VALIDATION_FAILED");
			expect(error.statusCode).toBe(400);
		});

		it("should be an instance of ResourceError", () => {
			const error = new ResourceValidationError({
				message: "Bad data",
				code: "BAD_DATA",
			});

			expect(error).toBeInstanceOf(ResourceError);
		});

		it("should store the original error when provided", () => {
			const originalError = new Error("Schema mismatch");

			const error = new ResourceValidationError({
				message: "Validation failed",
				code: "VALIDATION_FAILED",
				error: originalError,
			});

			expect(error.error).toBe(originalError);
		});
	});
});
