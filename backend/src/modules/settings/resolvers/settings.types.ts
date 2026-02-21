import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SettingsResponse {
	@Field(() => ID)
	id: number;

	@Field()
	userId: string;

	@Field()
	value: string;
}
