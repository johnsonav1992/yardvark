import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class ProductInput {
	@Field(() => Int)
	public productId!: number;

	@Field(() => Float)
	public productQuantity!: number;

	@Field()
	public productQuantityUnit!: string;
}

@InputType()
export class CreateEntryInput {
	@Field()
	public date!: Date;

	@Field({ nullable: true })
	public time?: string;

	@Field({ nullable: true })
	public title?: string;

	@Field({ nullable: true })
	public notes?: string;

	@Field(() => Float, { nullable: true })
	public soilTemperature?: number;

	@Field({ nullable: true })
	public soilTemperatureUnit?: string;

	@Field(() => Float, { nullable: true })
	public mowingHeight?: number;

	@Field({ nullable: true })
	public mowingHeightUnit?: string;

	@Field(() => [Int], { nullable: true })
	public activityIds?: number[];

	@Field(() => [Int], { nullable: true })
	public lawnSegmentIds?: number[];

	@Field(() => [ProductInput], { nullable: true })
	public products?: ProductInput[];

	@Field(() => [String], { nullable: true })
	public imageUrls?: string[];
}

@InputType()
export class UpdateEntryInput {
	@Field({ nullable: true })
	public date?: Date;

	@Field({ nullable: true })
	public time?: string;

	@Field({ nullable: true })
	public title?: string;

	@Field({ nullable: true })
	public notes?: string;

	@Field(() => Float, { nullable: true })
	public soilTemperature?: number;

	@Field({ nullable: true })
	public soilTemperatureUnit?: string;

	@Field(() => Float, { nullable: true })
	public mowingHeight?: number;

	@Field({ nullable: true })
	public mowingHeightUnit?: string;

	@Field(() => [Int], { nullable: true })
	public activityIds?: number[];

	@Field(() => [Int], { nullable: true })
	public lawnSegmentIds?: number[];

	@Field(() => [ProductInput], { nullable: true })
	public products?: ProductInput[];

	@Field(() => [String], { nullable: true })
	public imageUrls?: string[];
}

@InputType()
export class SearchEntriesInput {
	@Field(() => [String], { nullable: true })
	public dateRange?: string[];

	@Field({ nullable: true })
	public titleOrNotes?: string;

	@Field(() => [Int], { nullable: true })
	public activities?: number[];

	@Field(() => [Int], { nullable: true })
	public lawnSegments?: number[];

	@Field(() => [Int], { nullable: true })
	public products?: number[];
}
