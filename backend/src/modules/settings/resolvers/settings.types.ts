import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SettingsResponse {
  @Field(() => ID)
  id: number;

  @Field()
  userId: string;

  @Field()
  value: string;
}
