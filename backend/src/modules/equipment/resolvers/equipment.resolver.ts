import {
	Resolver,
	Query,
	Mutation,
	Args,
	Context,
	Int,
	Float,
} from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { Equipment } from "../models/equipment.model";
import { EquipmentMaintenance } from "../models/equipmentMaintenance.model";
import { EquipmentService } from "../services/equipment.service";
import { GqlAuthGuard } from "../../../guards/gql-auth.guard";
import {
	CreateEquipmentInput,
	UpdateEquipmentInput,
	CreateMaintenanceInput,
	UpdateMaintenanceInput,
} from "./equipment.inputs";
import { GqlContext } from "../../../types/gql-context";
import { resultOrThrow } from "../../../utils/resultOrThrow";

@Resolver(() => Equipment)
@UseGuards(GqlAuthGuard)
export class EquipmentResolver {
	constructor(private readonly equipmentService: EquipmentService) {}

	@Query(() => [Equipment], { name: "equipment" })
	async getEquipment(@Context() ctx: GqlContext): Promise<Equipment[]> {
		return this.equipmentService.getAllUserEquipment(ctx.req.user.userId);
	}

	@Mutation(() => Equipment)
	async createEquipment(
		@Args("input") input: CreateEquipmentInput,
		@Context() ctx: GqlContext,
	): Promise<Equipment> {
		return this.equipmentService.createEquipment(ctx.req.user.userId, input);
	}

	@Mutation(() => Equipment)
	async updateEquipment(
		@Args("id", { type: () => Int }) id: number,
		@Args("input") input: UpdateEquipmentInput,
	): Promise<Equipment> {
		const result = await this.equipmentService.updateEquipment(id, input);

		return resultOrThrow(result);
	}

	@Mutation(() => Boolean)
	async deleteEquipment(
		@Args("id", { type: () => Int }) id: number,
	): Promise<boolean> {
		const result = await this.equipmentService.deleteEquipment(id);

		resultOrThrow(result);

		return true;
	}

	@Mutation(() => Boolean)
	async toggleEquipmentArchiveStatus(
		@Args("id", { type: () => Int }) id: number,
		@Args("isActive") isActive: boolean,
	): Promise<boolean> {
		await this.equipmentService.toggleEquipmentArchiveStatus(id, isActive);

		return true;
	}

	@Mutation(() => EquipmentMaintenance)
	async createMaintenanceRecord(
		@Args("equipmentId", { type: () => Int }) equipmentId: number,
		@Args("input") input: CreateMaintenanceInput,
	): Promise<EquipmentMaintenance> {
		const result = await this.equipmentService.createMaintenanceRecord(
			equipmentId,
			input,
		);

		return resultOrThrow(result);
	}

	@Mutation(() => EquipmentMaintenance)
	async updateMaintenanceRecord(
		@Args("id", { type: () => Int }) id: number,
		@Args("input") input: UpdateMaintenanceInput,
	): Promise<EquipmentMaintenance> {
		const result = await this.equipmentService.updateMaintenanceRecord(
			id,
			input,
		);

		return resultOrThrow(result);
	}

	@Mutation(() => Boolean)
	async deleteMaintenanceRecord(
		@Args("id", { type: () => Int }) id: number,
	): Promise<boolean> {
		const result = await this.equipmentService.deleteMaintenanceRecord(id);

		resultOrThrow(result);

		return true;
	}
}
