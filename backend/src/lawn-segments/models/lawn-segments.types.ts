import { LawnSegment } from './lawn-segments.model';

export type LawnSegmentCreationRequest = Omit<
  InstanceType<typeof LawnSegment>,
  'id' | 'entries' | 'userId'
>;
