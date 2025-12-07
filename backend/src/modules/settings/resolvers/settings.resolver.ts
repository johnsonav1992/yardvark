import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Settings } from '../models/settings.model';
import { SettingsService } from '../services/settings.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import { SettingsResponse } from './settings.types';
import { Stringified } from 'src/types/json-modified';
import { SettingsData } from '../models/settings.types';
import { GqlContext } from '../../../types/gql-context';

@Resolver(() => Settings)
@UseGuards(GqlAuthGuard)
export class SettingsResolver {
  constructor(private readonly settingsService: SettingsService) {}

  @Query(() => SettingsResponse, { name: 'settings', nullable: true })
  async getSettings(
    @Context() ctx: GqlContext,
  ): Promise<SettingsResponse | null> {
    const result = await this.settingsService.getUserSettings(
      ctx.req.user.userId,
    );

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
    @Context() ctx: GqlContext,
  ): Promise<string> {
    const result = await this.settingsService.updateSettings(
      ctx.req.user.userId,
      settings as Stringified<SettingsData>,
    );

    return JSON.stringify(result);
  }
}
