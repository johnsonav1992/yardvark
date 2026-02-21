import { Either, Err, Ok, error, success } from "./either";

describe("Either", () => {
	describe("error()", () => {
		it("should create an Err instance", () => {
			const result = error<string, number>("something went wrong");

			expect(result).toBeInstanceOf(Err);
		});

		it("should store the error value", () => {
			const result = error<string, number>("something went wrong");

			expect(result.value).toBe("something went wrong");
		});

		it("should work with complex error types", () => {
			const errPayload = { code: 404, message: "Not found" };
			const result = error<{ code: number; message: string }, string>(
				errPayload,
			);

			expect(result.value).toEqual({ code: 404, message: "Not found" });
		});
	});

	describe("success()", () => {
		it("should create an Ok instance", () => {
			const result = success<string, number>(42);

			expect(result).toBeInstanceOf(Ok);
		});

		it("should store the success value", () => {
			const result = success<string, number>(42);

			expect(result.value).toBe(42);
		});

		it("should work with complex success types", () => {
			const payload = { id: 1, name: "Test" };
			const result = success<string, { id: number; name: string }>(payload);

			expect(result.value).toEqual({ id: 1, name: "Test" });
		});
	});

	describe("isError()", () => {
		it("should return true for an Err instance", () => {
			const result = error<string, number>("fail");

			expect(result.isError()).toBe(true);
		});

		it("should return false for an Ok instance", () => {
			const result = success<string, number>(42);

			expect(result.isError()).toBe(false);
		});
	});

	describe("isSuccess()", () => {
		it("should return true for an Ok instance", () => {
			const result = success<string, number>(42);

			expect(result.isSuccess()).toBe(true);
		});

		it("should return false for an Err instance", () => {
			const result = error<string, number>("fail");

			expect(result.isSuccess()).toBe(false);
		});
	});

	describe("value property", () => {
		it("should return the error value for an Err instance", () => {
			const result: Either<string, number> = error("bad input");

			if (result.isError()) {
				expect(result.value).toBe("bad input");
			}
		});

		it("should return the success value for an Ok instance", () => {
			const result: Either<string, number> = success(100);

			if (result.isSuccess()) {
				expect(result.value).toBe(100);
			}
		});

		it("should return the wrapped value directly without narrowing", () => {
			const errResult = error<string, number>("oops");
			const okResult = success<string, number>(7);

			expect(errResult.value).toBe("oops");
			expect(okResult.value).toBe(7);
		});
	});

	describe("type narrowing", () => {
		it("should narrow to Err type after isError() check", () => {
			const result: Either<string, number> = error("type error");

			if (result.isError()) {
				const errValue: string = result.value;
				expect(errValue).toBe("type error");
			} else {
				fail("Expected result to be an Err");
			}
		});

		it("should narrow to Ok type after isSuccess() check", () => {
			const result: Either<string, number> = success(99);

			if (result.isSuccess()) {
				const okValue: number = result.value;
				expect(okValue).toBe(99);
			} else {
				fail("Expected result to be an Ok");
			}
		});

		it("should narrow correctly in an else branch after isError()", () => {
			const result: Either<string, number> = success(50);

			if (result.isError()) {
				fail("Expected result to be an Ok");
			} else {
				expect(result.isSuccess()).toBe(true);
				expect(result.value).toBe(50);
			}
		});

		it("should narrow correctly in an else branch after isSuccess()", () => {
			const result: Either<string, number> = error("nope");

			if (result.isSuccess()) {
				fail("Expected result to be an Err");
			} else {
				expect(result.isError()).toBe(true);
				expect(result.value).toBe("nope");
			}
		});

		it("should work with different left and right types in a realistic scenario", () => {
			const fetchUser = (
				id: number,
			): Either<
				{ code: number; msg: string },
				{ name: string; age: number }
			> => {
				if (id <= 0) {
					return error({ code: 400, msg: "Invalid ID" });
				}

				return success({ name: "Alice", age: 30 });
			};

			const errorResult = fetchUser(-1);

			if (errorResult.isError()) {
				expect(errorResult.value.code).toBe(400);
				expect(errorResult.value.msg).toBe("Invalid ID");
			} else {
				fail("Expected an error for negative ID");
			}

			const successResult = fetchUser(1);

			if (successResult.isSuccess()) {
				expect(successResult.value.name).toBe("Alice");
				expect(successResult.value.age).toBe(30);
			} else {
				fail("Expected success for valid ID");
			}
		});
	});
});
