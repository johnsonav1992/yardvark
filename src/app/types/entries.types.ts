import { Activity } from './activities.types';

export type Entry = {
  id: number;
  userId: string;
  date: string;
  title: string;
  notes: string;
  activities: Activity[];
  lawnSegments: LawnSegment[];
};

export interface LawnSegment {
  id: number;
  userId: string;
  name: string;
  size: number;
}
