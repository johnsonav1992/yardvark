import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { EquipmentMaintenance } from './equipmentMaintenance.model';

@ObjectType()
@Entity('equipment')
export class Equipment {
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
  model: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true, default: 'center center' })
  imagePosition?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  serialNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  purchaseDate?: Date;

  @Field(() => Float, { nullable: true })
  @Column({ nullable: true })
  purchasePrice?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fuelType?: string;

  @Field({ nullable: true })
  @Column({ default: true })
  isActive?: boolean;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Field(() => [EquipmentMaintenance], { nullable: true })
  @OneToMany(() => EquipmentMaintenance, (maintenance) => maintenance.equipment)
  maintenanceRecords: EquipmentMaintenance[];
}
