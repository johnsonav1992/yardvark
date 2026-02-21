import { ObjectType, Field, ID, Float } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";
import { Entry } from "../../entries/models/entries.model";
import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	Unique,
	ManyToMany,
} from "typeorm";

@ObjectType()
@Entity("lawn_segments")
@Unique(["userId", "name"])
export class LawnSegment {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column()
	userId: string;

	@Field()
	@Column()
	name: string;

	@Field(() => Float)
	@Column({ type: "decimal", precision: 10, scale: 2 })
	size: number;

	@Field(() => GraphQLJSON, { nullable: true })
	@Column({ type: "jsonb", nullable: true })
	coordinates: number[][][] | null;

	@Field({ nullable: true })
	@Column({ type: "varchar", length: 7, default: "#3388ff" })
	color: string;

	@ManyToMany(
		() => Entry,
		(entry) => entry.lawnSegments,
	)
	entries: Entry[];
}
