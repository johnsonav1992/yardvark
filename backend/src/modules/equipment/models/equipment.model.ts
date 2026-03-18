import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import {
	Column,
	DeleteDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { EquipmentMaintenance } from "./equipmentMaintenance.model";

@ObjectType()
@Entity("equipment")
export class Equipment {
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
	public model!: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public description?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public imageUrl?: string;

	@Field({ nullable: true })
	@Column({ nullable: true, default: "center center" })
	public imagePosition?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public serialNumber?: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public purchaseDate?: Date;

	@Field(() => Float, { nullable: true })
	@Column({ nullable: true })
	public purchasePrice?: number;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public fuelType?: string;

	@Field({ nullable: true })
	@Column({ default: true })
	public isActive?: boolean;

	@Field()
	@Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	public createdAt!: Date;

	@Field({ nullable: true })
	@Column({ nullable: true })
	public updatedAt?: Date;

	@DeleteDateColumn()
	public deletedAt?: Date;

	@Field(() => [EquipmentMaintenance], { nullable: true })
	@OneToMany(
		() => EquipmentMaintenance,
		(maintenance) => maintenance.equipment,
	)
	public maintenanceRecords!: EquipmentMaintenance[];
}
