import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Activity } from 'src/activities/models/activities.model';
import { LawnSegment } from 'src/lawn-segments/models/lawn-segments.model';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  date: Date;

  @Column()
  title: string;

  @Column()
  notes: string;

  @ManyToMany(() => Activity, (activity) => activity.entries)
  @JoinTable({
    name: 'entryActivities',
    joinColumn: { name: 'entryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'activityId', referencedColumnName: 'id' },
  })
  activities: Activity[];

  @ManyToMany(() => LawnSegment, (lawnSegment) => lawnSegment.entries)
  @JoinTable({
    name: 'entryLawnSegments',
    joinColumn: { name: 'entryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lawnSegmentId', referencedColumnName: 'id' },
  })
  lawnSegments: LawnSegment[];
}
