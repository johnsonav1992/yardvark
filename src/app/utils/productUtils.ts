import type { Product } from "../types/products.types";

/**
 * Gets the default app rate of a product if available for quickly filling form data
 */
export const getDefaultProductAmount = (product: Product) => {
	const rate = product.applicationRate?.split("/")[0].trim();

	return rate ? parseFloat(rate) : 1;
};
