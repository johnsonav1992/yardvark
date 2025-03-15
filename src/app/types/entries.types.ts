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
};

export type EntryCreationRequest = {
  date: Date;
  notes: string;
  title: string;
  userId: string;
  soilTemperature: number;
  activityIds: number[];
  lawnSegmentIds: number[];
  soilTemperatureUnit: string;
};
