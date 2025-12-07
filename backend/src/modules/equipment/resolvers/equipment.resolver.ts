import { Resolver, Query, Mutation, Args, Context, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Equipment } from '../models/equipment.model';
import { EquipmentMaintenance } from '../models/equipmentMaintenance.model';
import { EquipmentService } from '../services/equipment.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import { CreateEquipmentInput, UpdateEquipmentInput, CreateMaintenanceInput, UpdateMaintenanceInput } from './equipment.inputs';

@Resolver(() => Equipment)
@UseGuards(GqlAuthGuard)
export class EquipmentResolver {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Query(() => [Equipment], { name: 'equipment' })
  async getEquipment(@Context() ctx: { user: { userId: string } }): Promise<Equipment[]> {
    return this.equipmentService.getAllUserEquipment(ctx.user.userId);
  }

  @Mutation(() => Equipment)
  async createEquipment(
    @Args('input') input: CreateEquipmentInput,
    @Context() ctx: { user: { userId: string } },
  ): Promise<Equipment> {
    return this.equipmentService.createEquipment(ctx.user.userId, input);
  }

  @Mutation(() => Equipment)
  async updateEquipment(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateEquipmentInput,
  ): Promise<Equipment> {
    return this.equipmentService.updateEquipment(id, input);
  }

  @Mutation(() => Boolean)
  async deleteEquipment(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.equipmentService.deleteEquipment(id);

    return true;
  }

  @Mutation(() => Boolean)
  async toggleEquipmentArchiveStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('isActive') isActive: boolean,
  ): Promise<boolean> {
    await this.equipmentService.toggleEquipmentArchiveStatus(id, isActive);

    return true;
  }

  @Mutation(() => EquipmentMaintenance)
  async createMaintenanceRecord(
    @Args('equipmentId', { type: () => Int }) equipmentId: number,
    @Args('input') input: CreateMaintenanceInput,
  ): Promise<EquipmentMaintenance> {
    return this.equipmentService.createMaintenanceRecord(equipmentId, input);
  }

  @Mutation(() => EquipmentMaintenance)
  async updateMaintenanceRecord(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateMaintenanceInput,
  ): Promise<EquipmentMaintenance> {
    return this.equipmentService.updateMaintenanceRecord(id, input);
  }

  @Mutation(() => Boolean)
  async deleteMaintenanceRecord(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.equipmentService.deleteMaintenanceRecord(id);
    
    return true;
  }
}