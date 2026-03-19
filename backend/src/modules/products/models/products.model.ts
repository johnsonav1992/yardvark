import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import {
	Column,
	DeleteDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { EntryProduct } from "../../entries/models/entries.model";
import { productTypesArray } from "./products.types";

@ObjectType()
@Entity("products")
export class Product {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	public id!: number;

	@Field()
	@Column()
	public userId!: string;

	@Field()
	@Column()
	public name!: string;

	@Field()
	@Column()
	public brand!: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public description?: string;

	@Field()
	@Column({
		type: "enum",
		enum: productTypesArray,
	})
	public category!: string;

	@Field(() => Float, { nullable: true })
	@Column({ nullable: true, type: "decimal", precision: 5, scale: 2 })
	public price?: number;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public quantityUnit?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public applicationRate?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public applicationMethod?: string;

	@Field(() => Int, { nullable: true })
	@Column({ nullable: true })
	public coverage?: number;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public coverageUnit?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public guaranteedAnalysis?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public containerType?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public imageUrl?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public imageCredit?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public labelUrl?: string;

	@Field()
	@Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	public createdAt!: Date;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public updatedAt?: Date;

	@OneToMany(
		() => EntryProduct,
		(entryProduct) => entryProduct.product,
	)
	public entryProducts!: EntryProduct[];

	@DeleteDateColumn()
	public deletedAt?: Date;
}
