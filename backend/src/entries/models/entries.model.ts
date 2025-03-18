import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  DeleteDateColumn,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LawnSegment } from 'src/lawn-segments/models/lawn-segments.model';
import { Activity } from 'src/activities/models/activities.model';
import { Product } from 'src/products/models/products.model';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  date: Date;

  @Column()
  title: string;

  @Column({ nullable: true })
  notes: string;

  @Column('decimal')
  soilTemperature: number;

  @Column()
  soilTemperatureUnit: string;

  @ManyToMany(() => Activity, (activity) => activity.entries)
  @JoinTable({
    name: 'entry_activities',
    joinColumn: { name: 'entry_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'activity_id', referencedColumnName: 'id' },
  })
  activities: Activity[];

  @ManyToMany(() => LawnSegment, (lawnSegment) => lawnSegment.entries)
  @JoinTable({
    name: 'entry_lawn_segments',
    joinColumn: { name: 'entry_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lawn_segment_id', referencedColumnName: 'id' },
  })
  lawnSegments: LawnSegment[];

  @OneToMany(() => EntryProduct, (entryProduct) => entryProduct.entry, {
    cascade: ['insert'],
  })
  entryProducts: EntryProduct[];

  @DeleteDateColumn()
  deletedAt?: Date;
}

@Entity({ name: 'entry_products' })
export class EntryProduct {
  @PrimaryColumn()
  entryId: number;

  @PrimaryColumn()
  productId: number;

  @ManyToOne(() => Entry, (entry) => entry, {
    onDelete: 'CASCADE',
  })
  entry: Entry;

  @ManyToOne(() => Product, (product) => product, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column('decimal')
  productQuantity: number;

  @Column()
  productQuantityUnit: string;
}
