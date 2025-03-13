import { Activity } from './activities.types';
import { LawnSegment } from './lawnSegments.types';

export type Entry = {
  id: number;
  userId: string;
  date: string;
  title: string;
  notes: string;
  activities: Activity[];
  lawnSegments: LawnSegment[];
};
