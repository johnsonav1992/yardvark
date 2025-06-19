export type Stringified<TObj> = string & { source: TObj };

declare global {
	interface JSON {
		stringify<T>(
			value: T,
			replacer?: null,
			space?: string | number
		): Stringified<T>;

		parse<T>(text: Stringified<T>, replacer?: null): T;
	}
}
