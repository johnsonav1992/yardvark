import { ObjectType, Field, ID, Float, Int } from "@nestjs/graphql";
import {
	Column,
	DeleteDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { productTypesArray } from "./products.types";
import { EntryProduct } from "../../entries/models/entries.model";

@ObjectType()
@Entity("products")
export class Product {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column()
	userId: string;

	@Field()
	@Column()
	name: string;

	@Field()
	@Column()
	brand: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	description?: string;

	@Field()
	@Column({
		type: "enum",
		enum: productTypesArray,
	})
	category: string;

	@Field(() => Float, { nullable: true })
	@Column({ nullable: true, type: "decimal", precision: 5, scale: 2 })
	price?: number;

	@Field({ nullable: true })
	@Column({ nullable: true })
	quantityUnit?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	applicationRate?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	applicationMethod?: string;

	@Field(() => Int, { nullable: true })
	@Column({ nullable: true })
	coverage?: number;

	@Field({ nullable: true })
	@Column({ nullable: true })
	coverageUnit?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	guaranteedAnalysis?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	containerType?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	imageUrl?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	labelUrl?: string;

	@Field()
	@Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	createdAt: Date;

	@Field({ nullable: true })
	@Column({ nullable: true })
	updatedAt?: Date;

	@OneToMany(
		() => EntryProduct,
		(entryProduct) => entryProduct.product,
	)
	entryProducts: EntryProduct[];

	@DeleteDateColumn()
	deletedAt?: Date;
}
