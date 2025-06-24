/**
 * Returns the number of pounds of nitrogen in a fertilizer application
 *
 * @param poundsOfProduct - The weight of the fertilizer product in pounds
 * @param guaranteedAnalysisOfProduct - The guaranteed analysis of the fertilizer product (e.g., "10-10-10")
 * @returns The number of pounds of nitrogen in the fertilizer application
 */
export const getPoundsOfNInFertilizerApp = ({
  poundsOfProduct,
  guaranteedAnalysisOfProduct,
  totalSquareFeet
}: {
  poundsOfProduct: number;
  guaranteedAnalysisOfProduct: string;
  totalSquareFeet?: number;
}) => {
  const nRateOfProduct = +guaranteedAnalysisOfProduct.split('-')[0];
  const nPercent = nRateOfProduct / 100;
  const poundsOfN = poundsOfProduct * nPercent;

  if (totalSquareFeet && totalSquareFeet > 0) {
    const poundsOfNPer1000SqFt = poundsOfN * (1000 / totalSquareFeet);
    return Math.round(poundsOfNPer1000SqFt * 100) / 100;
  }

  return Math.round(poundsOfN * 100) / 100;
};

/**
 * Calculates the pounds of fertilizer product needed to achieve a desired nitrogen application rate.
 *
 * @param options - The input parameters
 * @param options.desiredLbsOfNPer1000SqFt - The desired pounds of nitrogen per 1000 square feet
 * @param options.guaranteedAnalysisOfProduct - The guaranteed analysis of the product in the format 'N-P-K'
 * @param options.totalSquareFeet - The total area in square feet to be fertilized
 * @returns The pounds of product needed rounded to 2 decimal places, or null if totalSquareFeet is not positive
 *
 * @example
 * // Calculate pounds of product needed for 0.5 lbs N per 1000 sq ft with a 10-10-10 fertilizer on 5000 sq ft lawn
 * const result = getPoundsOfProductForDesiredN({
 *   desiredLbsOfNPer1000SqFt: 0.5,
 *   guaranteedAnalysisOfProduct: '10-10-10',
 *   totalSquareFeet: 5000
 * });
 * // result: 25
 */
export const getPoundsOfProductForDesiredN = ({
  desiredLbsOfNPer1000SqFt,
  guaranteedAnalysisOfProduct,
  totalSquareFeet
}: {
  desiredLbsOfNPer1000SqFt: number;
  guaranteedAnalysisOfProduct: string;
  totalSquareFeet: number;
}) => {
  const nRateOfProduct = +guaranteedAnalysisOfProduct.split('-')[0];
  const nPercent = nRateOfProduct / 100;

  if (totalSquareFeet > 0) {
    const poundsOfProduct =
      (desiredLbsOfNPer1000SqFt * totalSquareFeet) / (nPercent * 1000);
    return Math.round(poundsOfProduct * 100) / 100;
  }

  return null;
};

/**
 * Calculates the Growing Degree Days (GDD) for a single day.
 *
 * @param options - The input parameters
 * @param options.baseTemperature - The minimum temperature threshold for growth (e.g., 50°F for cool season grasses)
 * @param options.maxTemperature - The maximum temperature for the day
 * @param options.minTemperature - The minimum temperature for the day
 * @returns The GDD value for the day (minimum of 0)
 *
 * @example
 * // Calculate GDD for a day with max 75°F, min 55°F, and base temp of 50°F
 * const gdd = getDailyGDDCalculation({
 *   baseTemperature: 50,
 *   maxTemperature: 75,
 *   minTemperature: 55
 * });
 * // result: 15
 */
export const getDailyGDDCalculation = ({
  baseTemperature,
  maxTemperature,
  minTemperature
}: {
  baseTemperature: number;
  maxTemperature: number;
  minTemperature: number;
}): number => {
  const averageTemp = (maxTemperature + minTemperature) / 2;
  return Math.max(0, averageTemp - baseTemperature);
};
