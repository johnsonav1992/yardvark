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
	public id!: number;

	@Field()
	@Column()
	public userId!: string;

	@Field()
	@Column("timestamptz")
	public date!: Date;

	@Field({ nullable: true })
	@Column("time", { nullable: true })
	public time?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public title?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public notes!: string;

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
	public soilTemperature!: number;

	@Field()
	@Column()
	public soilTemperatureUnit!: string;

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
	public mowingHeight?: number;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public mowingHeightUnit?: string;

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
	public activities!: Activity[];

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
	public lawnSegments!: LawnSegment[];

	@Field(() => [EntryProduct], { nullable: true })
	@OneToMany(
		() => EntryProduct,
		(entryProduct) => entryProduct.entry,
		{
			cascade: true,
		},
	)
	public entryProducts!: EntryProduct[];

	@Field(() => [EntryImage], { nullable: true })
	@OneToMany(
		() => EntryImage,
		(entryImage) => entryImage.entry,
		{
			cascade: true,
		},
	)
	public entryImages!: EntryImage[];

	@DeleteDateColumn()
	public deletedAt?: Date;
}

@ObjectType()
@Entity({ name: "entry_products" })
export class EntryProduct {
	@Field(() => ID)
	@PrimaryColumn()
	public entryId!: number;

	@Field(() => ID)
	@PrimaryColumn()
	public productId!: number;

	@ManyToOne(
		() => Entry,
		(entry) => entry,
		{
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		},
	)
	@JoinColumn({ name: "entry_id" })
	public entry!: Entry;

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
	public product!: Product;

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
	public productQuantity!: number;

	@Field()
	@Column()
	public productQuantityUnit!: string;
}

@ObjectType()
@Entity({ name: "entry_images" })
export class EntryImage {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	public id!: number;

	@Field()
	@Column()
	public imageUrl!: string;

	@ManyToOne(
		() => Entry,
		(entry) => entry.entryImages,
		{
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		},
	)
	@JoinColumn({ name: "entry_id" })
	public entry!: Entry;

	@DeleteDateColumn()
	public deletedAt?: Date;
}
