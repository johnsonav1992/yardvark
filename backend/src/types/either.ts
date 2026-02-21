export type Either<L, A> = Err<L, A> | Ok<L, A>;

export class Err<L, A> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isError(): this is Err<L, A> {
    return true;
  }

  isSuccess(): this is Ok<L, A> {
    return false;
  }
}

export class Ok<L, A> {
  readonly value: A;

  constructor(value: A) {
    this.value = value;
  }

  isError(): this is Err<L, A> {
    return false;
  }

  isSuccess(): this is Ok<L, A> {
    return true;
  }
}

export const error = <L, A>(l: L): Either<L, A> => {
  return new Err(l);
};

export const success = <L, A>(a: A): Either<L, A> => {
  return new Ok<L, A>(a);
};
