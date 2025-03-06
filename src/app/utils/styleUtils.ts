import { $dt } from '@primeng/themes';
import { PrimeNGColorToken } from '../types/types';

export const getPrimeNgHexColor = (tokenName: PrimeNGColorToken): string => {
  const token = $dt(tokenName);

  return token.value;
};
