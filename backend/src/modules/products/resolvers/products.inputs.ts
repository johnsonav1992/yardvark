import { Field, Float, InputType, Int, ObjectType } from "@nestjs/graphql";
import { Product } from "../models/products.model";

@InputType()
export class CreateProductInput {
	@Field()
	public name!: string;

	@Field()
	public brand!: string;

	@Field({ nullable: true })
	public description?: string;

	@Field()
	public category!: string;

	@Field(() => Float, { nullable: true })
	public price?: number;

	@Field({ nullable: true })
	public quantityUnit?: string;

	@Field({ nullable: true })
	public applicationRate?: string;

	@Field({ nullable: true })
	public applicationMethod?: string;

	@Field(() => Int, { nullable: true })
	public coverage?: number;

	@Field({ nullable: true })
	public coverageUnit?: string;

	@Field({ nullable: true })
	public guaranteedAnalysis?: string;

	@Field({ nullable: true })
	public containerType?: string;

	@Field({ nullable: true })
	public imageUrl?: string;

	@Field({ nullable: true })
	public labelUrl?: string;
}

@InputType()
export class UpdateProductInput {
	@Field({ nullable: true })
	public name?: string;

	@Field({ nullable: true })
	public brand?: string;

	@Field({ nullable: true })
	public description?: string;

	@Field({ nullable: true })
	public category?: string;

	@Field(() => Float, { nullable: true })
	public price?: number;

	@Field({ nullable: true })
	public quantityUnit?: string;

	@Field({ nullable: true })
	public applicationRate?: string;

	@Field({ nullable: true })
	public applicationMethod?: string;

	@Field(() => Int, { nullable: true })
	public coverage?: number;

	@Field({ nullable: true })
	public coverageUnit?: string;

	@Field({ nullable: true })
	public guaranteedAnalysis?: string;

	@Field({ nullable: true })
	public containerType?: string;

	@Field({ nullable: true })
	public imageUrl?: string;

	@Field({ nullable: true })
	public labelUrl?: string;
}

@ObjectType()
export class ProductWithHidden extends Product {
	@Field()
	public isHidden!: boolean;
}
