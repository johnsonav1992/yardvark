import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Entry, EntryProduct } from '../types/entries.types';
import { Product } from '../types/products.types';
import { QUANTITY_UNITS } from '../constants/product-constants';
import { getDefaultProductAmount } from './productUtils';

export const getEntryIcon = (entry: Entry) => {
	const entriesIconMap = {
		mow: 'li li-lawnmower',
		water: 'li li-sprinkler',
	};

	return (
		entriesIconMap[entry.activities[0]?.name as keyof typeof entriesIconMap] ||
		'ti ti-list'
	);
};

export const createEntryProductRow = (product?: Product | EntryProduct) => {
	return new FormGroup({
		product: new FormControl<Product | EntryProduct | null>(product || null),
		quantity: new FormControl<number | null>(
			product?.quantity ||
				(!!product ? getDefaultProductAmount(product as Product) : 1),
			[Validators.min(0.1)],
		),
		quantityUnit: new FormControl<string>(
			product?.quantityUnit || QUANTITY_UNITS[0],
			[Validators.required],
		),
	});
};

export type EntryProductRow = ReturnType<typeof createEntryProductRow>;
