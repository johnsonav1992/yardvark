import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { EquipmentMaintenance } from './equipmentMaintenance.model';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true, default: 'center center' })
  imagePosition?: string;

  @Column({ nullable: true })
  serialNumber?: string;

  @Column({ nullable: true })
  purchaseDate?: Date;

  @Column({ nullable: true })
  purchasePrice?: number;

  @Column({ nullable: true })
  fuelType?: string;

  @Column({ default: true })
  isActive?: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => EquipmentMaintenance, (maintenance) => maintenance.equipment)
  maintenanceRecords: EquipmentMaintenance[];
}
