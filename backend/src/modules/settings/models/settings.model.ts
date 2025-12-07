import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@ObjectType()
@Entity('settings')
@Unique(['userId'])
export class Settings {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  userId: string;

  @Field()
  @Column()
  value: string;
}
