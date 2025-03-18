import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Entry } from '../types/entries.types';
import { Product } from '../types/products.types';
import { QUANTITY_UNITS } from '../constants/product-constants';

export const getEntryIcon = (entry: Entry) => {
  const entriesIconMap = {
    mow: 'li li-lawnmower',
    water: 'li li-sprinkler'
  };

  return (
    entriesIconMap[entry.activities[0]?.name as keyof typeof entriesIconMap] ||
    'ti ti-list'
  );
};

export const createEntryProductRow = (product?: Product) => {
  return new FormGroup({
    product: new FormControl<Product | null>(product || null),
    quantity: new FormControl<number | null>(null, [Validators.required]),
    quantityUnit: new FormControl<string>(
      product?.quantityUnit || QUANTITY_UNITS[0],
      [Validators.required]
    )
  });
};
