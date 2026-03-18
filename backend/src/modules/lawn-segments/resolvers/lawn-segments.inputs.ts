import { Field, Float, InputType, Int } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";

@InputType()
export class CreateLawnSegmentInput {
	@Field()
	public name!: string;

	@Field(() => Float)
	public size!: number;

	@Field(() => GraphQLJSON, { nullable: true })
	public coordinates?: number[][][] | null;

	@Field({ nullable: true })
	public color?: string;
}

@InputType()
export class UpdateLawnSegmentInput {
	@Field(() => Int)
	public id!: number;

	@Field()
	public userId!: string;

	@Field()
	public name!: string;

	@Field(() => Float)
	public size!: number;

	@Field(() => GraphQLJSON, { nullable: true })
	public coordinates?: number[][][] | null;

	@Field({ nullable: true })
	public color?: string;
}
