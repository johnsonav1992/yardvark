import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateEquipmentInput {
  @Field()
  name: string;

  @Field()
  brand: string;

  @Field({ nullable: true })
  model?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  serialNumber?: string;

  @Field({ nullable: true })
  purchaseDate?: Date;

  @Field(() => Float, { nullable: true })
  purchasePrice?: number;

  @Field({ nullable: true })
  fuelType?: string;
}

@InputType()
export class UpdateEquipmentInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field({ nullable: true })
  model?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  serialNumber?: string;

  @Field({ nullable: true })
  purchaseDate?: Date;

  @Field(() => Float, { nullable: true })
  purchasePrice?: number;

  @Field({ nullable: true })
  fuelType?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class CreateMaintenanceInput {
  @Field()
  maintenanceDate: Date;

  @Field()
  notes: string;

  @Field(() => Float, { nullable: true })
  cost?: number;
}

@InputType()
export class UpdateMaintenanceInput {
  @Field({ nullable: true })
  maintenanceDate?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Float, { nullable: true })
  cost?: number;
}
