import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@ObjectType()
@Entity("settings")
@Unique(["userId"])
export class Settings {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	public id!: number;

	@Field()
	@Column()
	public userId!: string;

	@Field()
	@Column()
	public value!: string;
}
