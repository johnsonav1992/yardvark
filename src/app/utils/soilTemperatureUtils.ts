import { PrimeNGColorToken } from '../types/types';
import { getPrimeNgHexColor } from './styleUtils';

export const getSoilTemperatureDisplayColor = (soilTemp: number) => {
  const temperatureColorMap: { [key: number]: PrimeNGColorToken } = {
    25: 'indigo.400',
    40: 'blue.500',
    45: 'green.600',
    50: 'amber.200',
    70: 'amber.400',
  };

  for (const [temp, color] of Object.entries(temperatureColorMap)) {
    if (soilTemp < Number(temp)) return getPrimeNgHexColor(color);
  }

  return getPrimeNgHexColor('red.400');
};

export const calculate24HourSoilTempAverage = (soilTemps: number[]) => {
  const totalTemp = soilTemps.reduce((sum, temp) => sum + temp, 0);

  return Math.round((totalTemp / soilTemps.length) * 10) / 10;
};
