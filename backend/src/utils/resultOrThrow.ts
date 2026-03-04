import { HttpException } from "@nestjs/common";
import type { ResourceError } from "../errors/resource-error";
import type { Either } from "../types/either";

/**
 * Utility function to properly unwrap an `Either` result. If the result is an error,
 * it throws an `HttpException` with the appropriate status code and message.
 * If it's a success, it returns the value.
 */
export const resultOrThrow = <L extends ResourceError, A>(
	result: Either<L, A>,
): A => {
	if (result.isError()) {
		throw new HttpException(
			{ message: result.value.message, code: result.value.code },
			result.value.statusCode,
		);
	}

	return result.value;
};
