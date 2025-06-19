import { Entry } from '../../entries/models/entries.model';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Entry, (entry) => entry.activities)
  entries: Entry[];
}
