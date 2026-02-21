import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import {
	Column,
	DeleteDateColumn,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryColumn,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Activity } from "../../activities/models/activities.model";
import { LawnSegment } from "../../lawn-segments/models/lawn-segments.model";
import { Product } from "../../products/models/products.model";

@ObjectType()
@Entity("entries")
export class Entry {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column()
	userId: string;

	@Field()
	@Column("timestamptz")
	date: Date;

	@Field({ nullable: true })
	@Column("time", { nullable: true })
	time?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	title?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	notes: string;

	@Field(() => Float, { nullable: true })
	@Column("decimal", {
		transformer: {
			to: (value: number) => value,
			from: (value: string) => {
				const parsed = parseFloat(value);

				return Number.isNaN(parsed) ? null : parsed;
			},
		},
		nullable: true,
	})
	soilTemperature: number;

	@Field()
	@Column()
	soilTemperatureUnit: string;

	@Field(() => Float, { nullable: true })
	@Column("decimal", {
		transformer: {
			to: (value: number) => value,
			from: (value: string) => {
				const parsed = parseFloat(value);

				return Number.isNaN(parsed) ? null : parsed;
			},
		},
		nullable: true,
	})
	mowingHeight?: number;

	@Field({ nullable: true })
	@Column({ nullable: true })
	mowingHeightUnit?: string;

	@Field(() => [Activity], { nullable: true })
	@ManyToMany(
		() => Activity,
		(activity) => activity.entries,
	)
	@JoinTable({
		name: "entry_activities",
		joinColumn: { name: "entry_id", referencedColumnName: "id" },
		inverseJoinColumn: { name: "activity_id", referencedColumnName: "id" },
	})
	activities: Activity[];

	@Field(() => [LawnSegment], { nullable: true })
	@ManyToMany(
		() => LawnSegment,
		(lawnSegment) => lawnSegment.entries,
	)
	@JoinTable({
		name: "entry_lawn_segments",
		joinColumn: { name: "entry_id", referencedColumnName: "id" },
		inverseJoinColumn: { name: "lawn_segment_id", referencedColumnName: "id" },
	})
	lawnSegments: LawnSegment[];

	@Field(() => [EntryProduct], { nullable: true })
	@OneToMany(
		() => EntryProduct,
		(entryProduct) => entryProduct.entry,
		{
			cascade: true,
		},
	)
	entryProducts: EntryProduct[];

	@Field(() => [EntryImage], { nullable: true })
	@OneToMany(
		() => EntryImage,
		(entryImage) => entryImage.entry,
		{
			cascade: true,
		},
	)
	entryImages: EntryImage[];

	@Column("vector", { nullable: true })
	embedding?: string;

	@DeleteDateColumn()
	deletedAt?: Date;
}

@ObjectType()
@Entity({ name: "entry_products" })
export class EntryProduct {
	@Field(() => ID)
	@PrimaryColumn()
	entryId: number;

	@Field(() => ID)
	@PrimaryColumn()
	productId: number;

	@ManyToOne(
		() => Entry,
		(entry) => entry,
		{
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		},
	)
	@JoinColumn({ name: "entry_id" })
	entry: Entry;

	@Field(() => Product)
	@ManyToOne(
		() => Product,
		(product) => product,
		{
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		},
	)
	@JoinColumn({ name: "product_id" })
	product: Product;

	@Field(() => Float)
	@Column("decimal", {
		transformer: {
			to: (value: number) => value,
			from: (value: string) => {
				const parsed = parseFloat(value);

				return Number.isNaN(parsed) ? null : parsed;
			},
		},
	})
	productQuantity: number;

	@Field()
	@Column()
	productQuantityUnit: string;
}

@ObjectType()
@Entity({ name: "entry_images" })
export class EntryImage {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column()
	imageUrl: string;

	@ManyToOne(
		() => Entry,
		(entry) => entry.entryImages,
		{
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		},
	)
	@JoinColumn({ name: "entry_id" })
	entry: Entry;

	@DeleteDateColumn()
	deletedAt?: Date;
}
