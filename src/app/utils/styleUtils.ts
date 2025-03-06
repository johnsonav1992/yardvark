import { $dt } from '@primeng/themes';
import { PrimeNGColorToken } from '../types/types';

/**
 * Returns the hex color value of a PrimeNG color token.
 *
 * @param tokenName - The name of the PrimeNG color token.
 * @returns The hex color value of the PrimeNG color token.
 */
export const getPrimeNgHexColor = (tokenName: PrimeNGColorToken): string => {
  const token = $dt(tokenName);

  return token.value;
};
