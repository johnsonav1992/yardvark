import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@ObjectType()
@Entity("settings")
@Unique(["userId"])
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
