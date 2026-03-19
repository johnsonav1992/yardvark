import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SettingsResponse {
	@Field(() => ID)
	public id!: number;

	@Field()
	public userId!: string;

	@Field()
	public value!: string;
}
