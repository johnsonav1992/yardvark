import { Activity } from './activities.types';
import { LawnSegment } from './lawnSegments.types';

export type Entry = {
  id: number;
  userId: string;
  date: string;
  title: string;
  notes: string;
  soilTemperature: number | string;
  soilTemperatureUnit: string;
  activities: Activity[];
  lawnSegments: LawnSegment[];
  products: EntryProduct[];
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
  notes: string;
  title: string;
  userId: string;
  soilTemperature: number | null;
  activityIds: number[];
  lawnSegmentIds: number[];
  products: Array<{
    productId: number;
    productQuantity: number;
    productQuantityUnit: string;
  }>;
  soilTemperatureUnit: string;
};
