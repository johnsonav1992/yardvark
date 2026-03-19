import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import {
	Column,
	DeleteDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Equipment } from "./equipment.model";

@ObjectType()
@Entity("equipment_maintenance")
export class EquipmentMaintenance {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	public id!: number;

	@Field()
	@Column({ type: "timestamptz", nullable: false })
	public maintenanceDate!: Date;

	@Field()
	@Column({ type: "text" })
	public notes!: string;

	@Field(() => Float, { nullable: true })
	@Column({
		type: "decimal",
		precision: 10,
		scale: 2,
		nullable: true,
		transformer: {
			to: (value?: number) => value,
			from: (value?: string) => (value != null ? parseFloat(value) : null),
		},
	})
	public cost?: number;

	@Field()
	@Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	public createdAt!: Date;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public updatedAt?: Date;

	@Column({ nullable: true })
	@DeleteDateColumn()
	public deletedAt?: Date;

	@ManyToOne(
		() => Equipment,
		(equipment) => equipment.maintenanceRecords,
		{
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "equipment_id" })
	public equipment!: Equipment;
}
