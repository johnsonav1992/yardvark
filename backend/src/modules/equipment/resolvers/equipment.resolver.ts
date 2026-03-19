import { UseGuards } from "@nestjs/common";
import { Args, Context, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GqlAuthGuard } from "../../../guards/gql-auth.guard";
import type { GqlContext } from "../../../types/gql-context";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import { Equipment } from "../models/equipment.model";
import { EquipmentMaintenance } from "../models/equipmentMaintenance.model";
import { EquipmentService } from "../services/equipment.service";
import {
	CreateEquipmentInput,
	CreateMaintenanceInput,
	UpdateEquipmentInput,
	UpdateMaintenanceInput,
} from "./equipment.inputs";

@Resolver(() => Equipment)
@UseGuards(GqlAuthGuard)
export class EquipmentResolver {
	constructor(private readonly equipmentService: EquipmentService) {}

	@Query(() => [Equipment], { name: "equipment" })
	async getEquipment(@Context() ctx: GqlContext): Promise<Equipment[]> {
		return this.equipmentService.getAllUserEquipment(ctx.req.user.userId);
	}

	@Query(() => Equipment, { name: "equipmentById", nullable: true })
	async getEquipmentById(
		@Args("id", { type: () => Int }) id: number,
	): Promise<Equipment | null> {
		const result = await this.equipmentService.getEquipmentById(id);

		return result.isSuccess() ? result.value : null;
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
		@Context() ctx: GqlContext,
	): Promise<Equipment> {
		const result = await this.equipmentService.updateEquipment(
			id,
			ctx.req.user.userId,
			input,
		);

		return resultOrThrow(result);
	}

	@Mutation(() => Boolean)
	async deleteEquipment(
		@Args("id", { type: () => Int }) id: number,
		@Context() ctx: GqlContext,
	): Promise<boolean> {
		const result = await this.equipmentService.deleteEquipment(
			id,
			ctx.req.user.userId,
		);

		resultOrThrow(result);

		return true;
	}

	@Mutation(() => Boolean)
	async toggleEquipmentArchiveStatus(
		@Args("id", { type: () => Int }) id: number,
		@Args("isActive") isActive: boolean,
		@Context() ctx: GqlContext,
	): Promise<boolean> {
		const result = await this.equipmentService.toggleEquipmentArchiveStatus(
			id,
			ctx.req.user.userId,
			isActive,
		);

		resultOrThrow(result);

		return true;
	}

	@Mutation(() => EquipmentMaintenance)
	async createMaintenanceRecord(
		@Args("equipmentId", { type: () => Int }) equipmentId: number,
		@Args("input") input: CreateMaintenanceInput,
		@Context() ctx: GqlContext,
	): Promise<EquipmentMaintenance> {
		const result = await this.equipmentService.createMaintenanceRecord(
			equipmentId,
			ctx.req.user.userId,
			input,
		);

		return resultOrThrow(result);
	}

	@Mutation(() => EquipmentMaintenance)
	async updateMaintenanceRecord(
		@Args("id", { type: () => Int }) id: number,
		@Args("input") input: UpdateMaintenanceInput,
		@Context() ctx: GqlContext,
	): Promise<EquipmentMaintenance> {
		const result = await this.equipmentService.updateMaintenanceRecord(
			id,
			ctx.req.user.userId,
			input,
		);

		return resultOrThrow(result);
	}

	@Mutation(() => Boolean)
	async deleteMaintenanceRecord(
		@Args("id", { type: () => Int }) id: number,
		@Context() ctx: GqlContext,
	): Promise<boolean> {
		const result = await this.equipmentService.deleteMaintenanceRecord(
			id,
			ctx.req.user.userId,
		);

		resultOrThrow(result);

		return true;
	}
}
