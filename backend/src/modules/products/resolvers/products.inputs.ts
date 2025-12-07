import { InputType, Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../models/products.model';

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field()
  brand: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  category: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field({ nullable: true })
  quantityUnit?: string;

  @Field({ nullable: true })
  applicationRate?: string;

  @Field({ nullable: true })
  applicationMethod?: string;

  @Field(() => Int, { nullable: true })
  coverage?: number;

  @Field({ nullable: true })
  coverageUnit?: string;

  @Field({ nullable: true })
  guaranteedAnalysis?: string;

  @Field({ nullable: true })
  containerType?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  labelUrl?: string;
}

@ObjectType()
export class ProductWithHidden extends Product {
  @Field()
  isHidden: boolean;
}
