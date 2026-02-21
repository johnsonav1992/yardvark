import { Entry, EntryProduct } from "../models/entries.model";

export const getEntryProductMapping = (entryProducts: EntryProduct[]) => {
	return entryProducts.map(
		({ product, productQuantity, productQuantityUnit }) => ({
			id: product.id,
			name: product.name,
			brand: product.brand,
			category: product.category,
			imageUrl: product.imageUrl,
			quantity: productQuantity,
			quantityUnit: productQuantityUnit,
			guaranteedAnalysis: product.guaranteedAnalysis,
			containerType: product.containerType,
		}),
	);
};

export const getEntryResponseMapping = (entry: Entry) => {
	const { entryProducts, entryImages, ...rest } = entry;

	return {
		...rest,
		products: getEntryProductMapping(entryProducts),
		images: entryImages
			? entryImages
					.filter((img) => !img.deletedAt)
					.map((img) => ({ imageUrl: img.imageUrl, id: img.id }))
			: [],
	};
};
