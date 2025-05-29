import { EntryProduct } from '../models/entries.model';

export const getEntryProductMapping = (entryProducts: EntryProduct[]) => {
  return entryProducts.map(
    ({ product, productQuantity, productQuantityUnit }) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      quantity: productQuantity,
      quantityUnit: productQuantityUnit,
      guaranteedAnalysis: product.guaranteedAnalysis,
      containerType: product.containerType,
    }),
  );
};
