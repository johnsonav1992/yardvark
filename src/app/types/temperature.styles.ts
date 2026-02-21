export type DegreesDisplay<TIncludeDegreeSymbol extends boolean = true> =
	TIncludeDegreeSymbol extends true ? `${number}°` : `${number}`;
