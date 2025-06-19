import { Entry, EntryProduct } from './entries.model';

export type EntryCreationRequest = Omit<
	InstanceType<typeof Entry>,
	'id' | 'activities' | 'lawnSegments' | 'userId'
> & {
	activityIds: number[];
	lawnSegmentIds: number[];
	products: Pick<
		EntryProduct,
		'productId' | 'productQuantity' | 'productQuantityUnit'
	>[];
	imageUrls?: string[];
};

export type EntriesSearchRequest = {
	dateRange: string[];
	titleOrNotes: string;
	activities: number[];
	lawnSegments: number[];
	products: number[];
};
