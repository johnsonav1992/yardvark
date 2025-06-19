import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	DeleteDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.model';

@Entity('equipment_maintenance')
export class EquipmentMaintenance {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'timestamptz', nullable: false })
	maintenanceDate: Date;

	@Column({ type: 'text' })
	notes: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	cost?: number;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ nullable: true })
	updatedAt?: Date;

	@Column({ nullable: true })
	@DeleteDateColumn()
	deletedAt?: Date;

	@ManyToOne(
		() => Equipment,
		(equipment) => equipment.maintenanceRecords,
		{
			onDelete: 'CASCADE',
		},
	)
	@JoinColumn({ name: 'equipment_id' })
	equipment: Equipment;
}
