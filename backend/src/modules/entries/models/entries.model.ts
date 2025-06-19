import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToMany,
	JoinTable,
	DeleteDateColumn,
	PrimaryColumn,
	ManyToOne,
	JoinColumn,
	OneToMany
} from 'typeorm';
import { LawnSegment } from '../../lawn-segments/models/lawn-segments.model';
import { Activity } from '../../activities/models/activities.model';
import { Product } from '../../products/models/products.model';

@Entity('entries')
export class Entry {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: string;

	@Column('timestamptz')
	date: Date;

	@Column('time', { nullable: true })
	time?: string;

	@Column({ nullable: true })
	title?: string;

	@Column({ nullable: true })
	notes: string;

	@Column('decimal', {
		transformer: {
			to: (value: number) => value,
			from: (value: string) => parseFloat(value)
		},
		nullable: true
	})
	soilTemperature: number;

	@Column()
	soilTemperatureUnit: string;

	@ManyToMany(
		() => Activity,
		(activity) => activity.entries
	)
	@JoinTable({
		name: 'entry_activities',
		joinColumn: { name: 'entry_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'activity_id', referencedColumnName: 'id' }
	})
	activities: Activity[];

	@ManyToMany(
		() => LawnSegment,
		(lawnSegment) => lawnSegment.entries
	)
	@JoinTable({
		name: 'entry_lawn_segments',
		joinColumn: { name: 'entry_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'lawn_segment_id', referencedColumnName: 'id' }
	})
	lawnSegments: LawnSegment[];

	@OneToMany(
		() => EntryProduct,
		(entryProduct) => entryProduct.entry,
		{
			cascade: true
		}
	)
	entryProducts: EntryProduct[];

	@OneToMany(
		() => EntryImage,
		(entryImage) => entryImage.entry,
		{
			cascade: true
		}
	)
	entryImages: EntryImage[];

	@DeleteDateColumn()
	deletedAt?: Date;
}

@Entity({ name: 'entry_products' })
export class EntryProduct {
	@PrimaryColumn()
	entryId: number;

	@PrimaryColumn()
	productId: number;

	@ManyToOne(
		() => Entry,
		(entry) => entry,
		{
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE'
		}
	)
	@JoinColumn({ name: 'entry_id' })
	entry: Entry;

	@ManyToOne(
		() => Product,
		(product) => product,
		{
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE'
		}
	)
	@JoinColumn({ name: 'product_id' })
	product: Product;

	@Column('decimal', {
		transformer: {
			to: (value: number) => value,
			from: (value: string) => parseFloat(value)
		}
	})
	productQuantity: number;

	@Column()
	productQuantityUnit: string;
}

@Entity({ name: 'entry_images' })
export class EntryImage {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	imageUrl: string;

	@ManyToOne(
		() => Entry,
		(entry) => entry.entryImages,
		{
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE'
		}
	)
	@JoinColumn({ name: 'entry_id' })
	entry: Entry;

	@DeleteDateColumn()
	deletedAt?: Date;
}
