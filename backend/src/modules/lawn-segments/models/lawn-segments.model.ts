import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";
import {
	Column,
	Entity,
	ManyToMany,
	PrimaryGeneratedColumn,
	Unique,
} from "typeorm";
import { Entry } from "../../entries/models/entries.model";

@ObjectType()
@Entity("lawn_segments")
@Unique(["userId", "name"])
export class LawnSegment {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	public id!: number;

	@Field()
	@Column()
	public userId!: string;

	@Field()
	@Column()
	public name!: string;

	@Field(() => Float)
	@Column({ type: "decimal", precision: 10, scale: 2 })
	public size!: number;

	@Field(() => GraphQLJSON, { nullable: true })
	@Column({ type: "jsonb", nullable: true })
	public coordinates!: number[][][] | null;

	@Field({ nullable: true })
	@Column({ type: "varchar", length: 7, default: "#3388ff" })
	public color!: string;

	@ManyToMany(
		() => Entry,
		(entry) => entry.lawnSegments,
	)
	public entries!: Entry[];
}
