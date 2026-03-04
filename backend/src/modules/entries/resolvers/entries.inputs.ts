import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class ProductInput {
	@Field(() => Int)
	productId: number;

	@Field(() => Float)
	productQuantity: number;

	@Field()
	productQuantityUnit: string;
}

@InputType()
export class CreateEntryInput {
	@Field()
	date: Date;

	@Field({ nullable: true })
	time?: string;

	@Field({ nullable: true })
	title?: string;

	@Field({ nullable: true })
	notes?: string;

	@Field(() => Float, { nullable: true })
	soilTemperature?: number;

	@Field({ nullable: true })
	soilTemperatureUnit?: string;

	@Field(() => Float, { nullable: true })
	mowingHeight?: number;

	@Field({ nullable: true })
	mowingHeightUnit?: string;

	@Field(() => [Int], { nullable: true })
	activityIds?: number[];

	@Field(() => [Int], { nullable: true })
	lawnSegmentIds?: number[];

	@Field(() => [ProductInput], { nullable: true })
	products?: ProductInput[];

	@Field(() => [String], { nullable: true })
	imageUrls?: string[];
}

@InputType()
export class UpdateEntryInput {
	@Field({ nullable: true })
	date?: Date;

	@Field({ nullable: true })
	time?: string;

	@Field({ nullable: true })
	title?: string;

	@Field({ nullable: true })
	notes?: string;

	@Field(() => Float, { nullable: true })
	soilTemperature?: number;

	@Field({ nullable: true })
	soilTemperatureUnit?: string;

	@Field(() => Float, { nullable: true })
	mowingHeight?: number;

	@Field({ nullable: true })
	mowingHeightUnit?: string;

	@Field(() => [Int], { nullable: true })
	activityIds?: number[];

	@Field(() => [Int], { nullable: true })
	lawnSegmentIds?: number[];

	@Field(() => [ProductInput], { nullable: true })
	products?: ProductInput[];

	@Field(() => [String], { nullable: true })
	imageUrls?: string[];
}

@InputType()
export class SearchEntriesInput {
	@Field(() => [String], { nullable: true })
	dateRange?: string[];

	@Field({ nullable: true })
	titleOrNotes?: string;

	@Field(() => [Int], { nullable: true })
	activities?: number[];

	@Field(() => [Int], { nullable: true })
	lawnSegments?: number[];

	@Field(() => [Int], { nullable: true })
	products?: number[];
}
