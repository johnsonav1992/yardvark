import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { LawnSegment } from 'src/lawn-segments/models/lawn-segments.model';
import { Activity } from 'src/activities/models/activities.model';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  date: Date;

  @Column()
  title: string;

  @Column()
  notes: string;

  @ManyToMany(() => Activity, (activity) => activity.entries)
  @JoinTable({
    name: 'entry_activities',
    joinColumn: { name: 'entry_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'activity_id', referencedColumnName: 'id' },
  })
  activities: Activity[];

  @ManyToMany(() => LawnSegment, (lawnSegment) => lawnSegment.entries)
  @JoinTable({
    name: 'entry_lawn_segments',
    joinColumn: { name: 'entry_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lawn_segment_id', referencedColumnName: 'id' },
  })
  lawnSegments: LawnSegment[];
}
