import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entry } from '../../entries/models/entries.model';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';

@ObjectType()
@Entity('activities')
export class Activity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @ManyToMany(() => Entry, (entry) => entry.activities)
  entries: Entry[];
}
