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
  products: Array<{
    productId: number;
    name: string;
    brand: string;
    productQuantity: number;
    productQuantityUnit: string;
  }>;
};

export type EntryCreationRequest = {
  date: Date;
  notes: string;
  title: string;
  userId: string;
  soilTemperature: number;
  activityIds: number[];
  lawnSegmentIds: number[];
  products: Array<{
    productId: number;
    productQuantity: number;
    productQuantityUnit: string;
  }>;
  soilTemperatureUnit: string;
};
