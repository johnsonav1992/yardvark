import { Entry } from 'src/entries/models/entries.model';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  ManyToMany,
} from 'typeorm';

@Entity('lawn_segments')
@Unique(['userId', 'name'])
export class LawnSegment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  size: number;

  @ManyToMany(() => Entry, (entry) => entry.lawnSegments)
  entries: Entry[];
}
