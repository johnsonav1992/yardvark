export type LatLong = {
  lat: number;
  long: number;
};

export type DegreesDisplay<TIncludeDegreeSymbol extends boolean = true> =
  TIncludeDegreeSymbol extends true ? `${number}°` : `${number}`;

export type PrimeNGColorToken =
  `${PrimeNgColors}.${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950}`;

export type PrimeNgColors =
  | 'emerald'
  | 'green'
  | 'lime'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone';
