import { HttpException } from "@nestjs/common";
import { resultOrThrow } from "./resultOrThrow";
import { error, success } from "../types/either";
import {
	ResourceError,
	ResourceNotFound,
	ExternalServiceError,
	ResourceValidationError,
} from "../errors/resource-error";

describe("unwrapResult", () => {
	describe("Ok results", () => {
		it("should return the value for a successful result", () => {
			const result = success<ResourceError, string>("hello");

			expect(resultOrThrow(result)).toBe("hello");
		});

		it("should return the value for a successful result with a number", () => {
			const result = success<ResourceError, number>(42);

			expect(resultOrThrow(result)).toBe(42);
		});

		it("should return the value for a successful result with an object", () => {
			const data = { id: 1, name: "Test" };
			const result = success<ResourceError, typeof data>(data);

			expect(resultOrThrow(result)).toEqual(data);
		});

		it("should return the value for a successful result with null", () => {
			const result = success<ResourceError, null>(null);

			expect(resultOrThrow(result)).toBeNull();
		});
	});

	describe("Err results", () => {
		it("should throw an HttpException for an error result", () => {
			const resourceError = new ResourceError({
				message: "Something went wrong",
				code: "GENERIC_ERROR",
			});
			const result = error<ResourceError, string>(resourceError);

			expect(() => resultOrThrow(result)).toThrow(HttpException);
		});

		it("should throw with the correct default statusCode of 500", () => {
			const resourceError = new ResourceError({
				message: "Internal error",
				code: "INTERNAL_ERROR",
			});
			const result = error<ResourceError, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(HttpException);
				expect((e as HttpException).getStatus()).toBe(500);
			}
		});

		it("should throw with the correct message and code in the body", () => {
			const resourceError = new ResourceError({
				message: "Something broke",
				code: "BROKEN",
				statusCode: 500,
			});
			const result = error<ResourceError, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(HttpException);
				const response = (e as HttpException).getResponse();
				expect(response).toEqual({
					message: "Something broke",
					code: "BROKEN",
				});
			}
		});
	});

	describe("ResourceNotFound", () => {
		it("should throw HttpException with status 404", () => {
			const resourceError = new ResourceNotFound({
				message: "User not found",
				code: "USER_NOT_FOUND",
			});
			const result = error<ResourceNotFound, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(HttpException);
				expect((e as HttpException).getStatus()).toBe(404);
			}
		});

		it("should include the correct message and code in the response body", () => {
			const resourceError = new ResourceNotFound({
				message: "Entry not found",
				code: "ENTRY_NOT_FOUND",
			});
			const result = error<ResourceNotFound, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				const response = (e as HttpException).getResponse();
				expect(response).toEqual({
					message: "Entry not found",
					code: "ENTRY_NOT_FOUND",
				});
			}
		});
	});

	describe("ExternalServiceError", () => {
		it("should throw HttpException with default status 502", () => {
			const resourceError = new ExternalServiceError({
				message: "Weather API unavailable",
				code: "WEATHER_API_ERROR",
			});
			const result = error<ExternalServiceError, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(HttpException);
				expect((e as HttpException).getStatus()).toBe(502);
			}
		});

		it("should throw HttpException with a custom statusCode when provided", () => {
			const resourceError = new ExternalServiceError({
				message: "Service timeout",
				code: "SERVICE_TIMEOUT",
				statusCode: 504,
			});
			const result = error<ExternalServiceError, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(HttpException);
				expect((e as HttpException).getStatus()).toBe(504);
			}
		});

		it("should include the correct message and code in the response body", () => {
			const resourceError = new ExternalServiceError({
				message: "Third-party failure",
				code: "THIRD_PARTY_FAILURE",
			});
			const result = error<ExternalServiceError, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				const response = (e as HttpException).getResponse();
				expect(response).toEqual({
					message: "Third-party failure",
					code: "THIRD_PARTY_FAILURE",
				});
			}
		});
	});

	describe("ResourceValidationError", () => {
		it("should throw HttpException with status 400", () => {
			const resourceError = new ResourceValidationError({
				message: "Invalid input",
				code: "VALIDATION_ERROR",
			});
			const result = error<ResourceValidationError, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(HttpException);
				expect((e as HttpException).getStatus()).toBe(400);
			}
		});

		it("should include the correct message and code in the response body", () => {
			const resourceError = new ResourceValidationError({
				message: "Name is required",
				code: "NAME_REQUIRED",
			});
			const result = error<ResourceValidationError, string>(resourceError);

			try {
				resultOrThrow(result);
				fail("Expected HttpException to be thrown");
			} catch (e) {
				const response = (e as HttpException).getResponse();
				expect(response).toEqual({
					message: "Name is required",
					code: "NAME_REQUIRED",
				});
			}
		});
	});
});
