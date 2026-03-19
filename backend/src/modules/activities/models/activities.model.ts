import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Entry } from "../../entries/models/entries.model";

@ObjectType()
@Entity("activities")
export class Activity {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	public id!: number;

	@Field()
	@Column()
	public name!: string;

	@ManyToMany(
		() => Entry,
		(entry) => entry.activities,
	)
	public entries!: Entry[];
}
