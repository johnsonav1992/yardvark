import { Field, Float, InputType, Int } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";

@InputType()
export class CreateLawnSegmentInput {
	@Field()
	name: string;

	@Field(() => Float)
	size: number;

	@Field(() => GraphQLJSON, { nullable: true })
	coordinates?: number[][][] | null;

	@Field({ nullable: true })
	color?: string;
}

@InputType()
export class UpdateLawnSegmentInput {
	@Field(() => Int)
	id: number;

	@Field()
	userId: string;

	@Field()
	name: string;

	@Field(() => Float)
	size: number;

	@Field(() => GraphQLJSON, { nullable: true })
	coordinates?: number[][][] | null;

	@Field({ nullable: true })
	color?: string;
}
