import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class CreateLawnSegmentInput {
  @Field()
  name: string;

  @Field(() => Float)
  size: number;
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
}
