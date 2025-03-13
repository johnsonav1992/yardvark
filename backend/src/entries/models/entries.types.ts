import { Entry } from './entries.model';

export type EntryCreationRequest = Omit<
  InstanceType<typeof Entry>,
  'id' | 'activities' | 'lawnSegments'
> & { activityIds: number[]; lawnSegmentIds: number[] };

// export type EntriesResponse = InstanceType<typeof Entry>[];
