import { LawnSegment } from '../types/lawnSegments.types';
import { Product } from '../types/products.types';
import { convertToPounds } from './generalUtils';

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
 * Calculates the nitrogen rate from the provided fields.
 *
 * @param totalLawnSize - The total lawn size in square feet
 * @param poundsOfN - The pounds of nitrogen applied
 * @param fertilizerAmount - The amount of fertilizer applied in pounds
 * @param nitrogenRate - The nitrogen rate to return if other values are not provided
 * @returns The calculated nitrogen rate or the provided nitrogen rate if applicable
 */
export const getNitrogenRateFromFields = ({
  totalLawnSize,
  poundsOfN,
  fertilizerAmount
}: {
  totalLawnSize: number | null;
  poundsOfN: number | null;
  fertilizerAmount: number | null;
}): number | undefined => {
  if (totalLawnSize && poundsOfN && fertilizerAmount) {
    const poundsOfNPer1000SqFt = (poundsOfN * 1000) / (totalLawnSize || 1);
    const nRate = (poundsOfNPer1000SqFt / fertilizerAmount) * 100;

    return Math.round(nRate * 100) / 100;
  }

  return undefined;
};

/**
 * Calculates the total square footage for a given array of lawn segments.
 *
 * @param lawnSegments - Array of lawn segments with size property
 * @returns The total square footage across all segments
 */
export const getTotalSquareFeetForSegments = (
  lawnSegments: Array<{ size: number }>
): number => {
  return lawnSegments.reduce(
    (total, segment) => total + Number(segment.size),
    0
  );
};

/**
 * Calculates the total nitrogen content for selected fertilizer products across lawn segments.
 *
 * @param selectedProducts - Array of form values with product, quantity, and quantityUnit
 * @param lawnSegments - Array of lawn segments to calculate total area
 * @returns Total nitrogen in pounds per 1000 square feet
 */
export const calculateNitrogenForProducts = (
  selectedProducts: Array<{
    product: Product;
    quantity: number;
    quantityUnit: string;
  }>,
  lawnSegments: LawnSegment[]
): number => {
  const totalSquareFeet = getTotalSquareFeetForSegments(lawnSegments);

  if (!totalSquareFeet) return 0;

  return selectedProducts.reduce((total, productRow) => {
    const product = productRow.product;
    const quantity = productRow.quantity;
    const quantityUnit = productRow.quantityUnit;

    if (!product || !quantity || !product.guaranteedAnalysis) return total;

    if ('category' in product && product.category !== 'fertilizer')
      return total;

    const quantityInPounds = convertToPounds(quantity, quantityUnit);

    const nitrogenPounds = getPoundsOfNInFertilizerApp({
      poundsOfProduct: quantityInPounds,
      guaranteedAnalysisOfProduct: product.guaranteedAnalysis,
      totalSquareFeet
    });

    return total + nitrogenPounds;
  }, 0);
};
