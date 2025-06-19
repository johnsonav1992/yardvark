import {
	Column,
	DeleteDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { productTypesArray } from './products.types';
import { EntryProduct } from '../../entries/models/entries.model';

@Entity('products')
export class Product {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: string;

	@Column()
	name: string;

	@Column()
	brand: string;

	@Column({ nullable: true })
	description?: string;

	@Column({
		type: 'enum',
		enum: productTypesArray,
	})
	category: string;

	@Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
	price?: number;

	@Column({ nullable: true })
	quantityUnit?: string;

	@Column({ nullable: true })
	applicationRate?: string;

	@Column({ nullable: true })
	applicationMethod?: string;

	@Column({ nullable: true })
	coverage?: number;

	@Column({ nullable: true })
	coverageUnit?: string;

	@Column({ nullable: true })
	guaranteedAnalysis?: string;

	@Column({ nullable: true })
	containerType?: string;

	@Column({ nullable: true })
	imageUrl?: string;

	@Column({ nullable: true })
	labelUrl?: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

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
