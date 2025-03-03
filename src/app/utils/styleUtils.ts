import { $dt } from '@primeng/themes';
import { PrimeColorToken } from '../types/types';

export const getPrimeNgHexColor = (tokenName: PrimeColorToken) => {
  const token = $dt(tokenName);

  return token.value;
};
