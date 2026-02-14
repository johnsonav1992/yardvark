import { HttpException } from '@nestjs/common';
import { Either } from '../types/either';
import { ResourceError } from '../errors/resource-error';

/**
 * Utility function to unwrap an `Either` result. If the result is an error,
 * it throws an `HttpException` with the appropriate status code and message.
 * If it's a success, it returns the value.
 */
export const unwrapResult = <L extends ResourceError, A>(
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
