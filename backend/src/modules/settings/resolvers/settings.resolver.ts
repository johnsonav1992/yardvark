import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Settings } from '../models/settings.model';
import { SettingsService } from '../services/settings.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import { SettingsResponse } from './settings.types';

@Resolver(() => Settings)
@UseGuards(GqlAuthGuard)
export class SettingsResolver {
  constructor(private readonly settingsService: SettingsService) {}

  @Query(() => SettingsResponse, { name: 'settings', nullable: true })
  async getSettings(@Context() ctx: { user: { userId: string } }): Promise<SettingsResponse | null> {
    const result = await this.settingsService.getUserSettings(ctx.user.userId);

    if (Array.isArray(result)) return null;

    return {
      id: result.id,
      userId: result.userId,
      value: JSON.stringify(result.value),
    };
  }

  @Mutation(() => String)
  async updateSettings(
    @Args('settings') settings: string,
    @Context() ctx: { user: { userId: string } },
  ): Promise<string> {
    const result = await this.settingsService.updateSettings(ctx.user.userId, settings);
    
    return JSON.stringify(result);
  }
}