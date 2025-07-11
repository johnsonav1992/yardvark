import { Activity } from './activities.types';
import { LawnSegment } from './lawnSegments.types';

export type Entry = {
  id: number;
  userId: string;
  date: string;
  time: string;
  title: string;
  notes: string;
  soilTemperature: number | string;
  soilTemperatureUnit: string;
  activities: Activity[];
  lawnSegments: LawnSegment[];
  products: EntryProduct[];
  images: { id: number; imageUrl: string }[];
};

export type EntryProduct = {
  id: number;
  name: string;
  brand: string;
  imageUrl: string;
  quantity: number;
  quantityUnit: string;
  guaranteedAnalysis: string;
  containerType: string;
};

export type EntryCreationRequest = {
  date: Date;
  time: string | null;
  notes: string;
  title: string;
  userId?: string;
  soilTemperature: number | null;
  activityIds: number[];
  lawnSegmentIds: number[];
  products: Array<{
    productId: number;
    productQuantity: number;
    productQuantityUnit: string;
  }>;
  soilTemperatureUnit: string;
  imageUrls?: string[];
  images?: File[];
};

export type EntryCreationRequestFormInput = Omit<
  EntryCreationRequest,
  'imageUrls'
> & {
  images: File[];
};

export type EntriesSearchRequest = {
  dateRange: string[];
  titleOrNotes: string;
  activities: number[];
  lawnSegments: number[];
  products: number[];
};
