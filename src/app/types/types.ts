export type LatLong = {
  lat: number;
  long: number;
};

export type DegreesDisplay<TIncludeDegreeSymbol extends boolean = true> =
  TIncludeDegreeSymbol extends true ? `${number}°` : `${number}`;

export type PrimeColorToken = `${string}.${string}`;
