import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class CreateEquipmentInput {
	@Field()
	public name!: string;

	@Field()
	public brand!: string;

	@Field({ nullable: true })
	public model?: string;

	@Field({ nullable: true })
	public description?: string;

	@Field({ nullable: true })
	public imageUrl?: string;

	@Field({ nullable: true })
	public imagePosition?: string;

	@Field({ nullable: true })
	public serialNumber?: string;

	@Field({ nullable: true })
	public purchaseDate?: Date;

	@Field(() => Float, { nullable: true })
	public purchasePrice?: number;

	@Field({ nullable: true })
	public fuelType?: string;
}

@InputType()
export class UpdateEquipmentInput {
	@Field({ nullable: true })
	public name?: string;

	@Field({ nullable: true })
	public brand?: string;

	@Field({ nullable: true })
	public model?: string;

	@Field({ nullable: true })
	public description?: string;

	@Field({ nullable: true })
	public imageUrl?: string;

	@Field({ nullable: true })
	public imagePosition?: string;

	@Field({ nullable: true })
	public serialNumber?: string;

	@Field({ nullable: true })
	public purchaseDate?: Date;

	@Field(() => Float, { nullable: true })
	public purchasePrice?: number;

	@Field({ nullable: true })
	public fuelType?: string;

	@Field({ nullable: true })
	public isActive?: boolean;
}

@InputType()
export class CreateMaintenanceInput {
	@Field()
	public maintenanceDate!: Date;

	@Field()
	public notes!: string;

	@Field(() => Float, { nullable: true })
	public cost?: number;
}

@InputType()
export class UpdateMaintenanceInput {
	@Field({ nullable: true })
	public maintenanceDate?: Date;

	@Field({ nullable: true })
	public notes?: string;

	@Field(() => Float, { nullable: true })
	public cost?: number;
}
