import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.model';

@ObjectType()
@Entity('equipment_maintenance')
export class EquipmentMaintenance {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: 'timestamptz', nullable: false })
  maintenanceDate: Date;

  @Field()
  @Column({ type: 'text' })
  notes: string;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  updatedAt?: Date;

  @Column({ nullable: true })
  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => Equipment, (equipment) => equipment.maintenanceRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;
}
