import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Entry } from '../models/entries.model';
import { EntriesService } from '../services/entries.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import {
  CreateEntryInput,
  UpdateEntryInput,
  SearchEntriesInput,
} from './entries.inputs';
import {
  EntriesSearchRequest,
  EntryCreationRequest,
} from '../models/entries.types';
import { GqlContext } from '../../../types/gql-context';
import { resultOrThrow } from '../../../utils/resultOrThrow';

@Resolver(() => Entry)
@UseGuards(GqlAuthGuard)
export class EntriesResolver {
  constructor(private readonly entriesService: EntriesService) {}

  @Query(() => [Entry], { name: 'entries' })
  async getEntries(
    @Context() ctx: GqlContext,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ) {
    const result = await this.entriesService.getEntries(
      ctx.req.user.userId,
      startDate,
      endDate,
      { raw: true },
    );

    return resultOrThrow(result);
  }

  @Query(() => Entry, { name: 'entry', nullable: true })
  async getEntry(@Args('id', { type: () => Int }) id: number) {
    const result = await this.entriesService.getEntry(id, { raw: true });

    return resultOrThrow(result);
  }

  @Query(() => Entry, { name: 'entryByDate', nullable: true })
  async getEntryByDate(@Args('date') date: string, @Context() ctx: GqlContext) {
    const result = await this.entriesService.getEntryByDate(
      ctx.req.user.userId,
      date,
      { raw: true },
    );

    return resultOrThrow(result);
  }

  @Query(() => Entry, { name: 'mostRecentEntry', nullable: true })
  async getMostRecentEntry(@Context() ctx: GqlContext) {
    return this.entriesService.getMostRecentEntry(ctx.req.user.userId, {
      raw: true,
    });
  }

  @Query(() => Date, { name: 'lastMowDate', nullable: true })
  async getLastMowDate(@Context() ctx: GqlContext) {
    return this.entriesService.getLastMowDate(ctx.req.user.userId);
  }

  @Query(() => Date, { name: 'lastProductApplicationDate', nullable: true })
  async getLastProductApplicationDate(@Context() ctx: GqlContext) {
    return this.entriesService.getLastProductApplicationDate(
      ctx.req.user.userId,
    );
  }

  @Query(() => [Entry], { name: 'searchEntries' })
  async searchEntries(
    @Args('input') input: SearchEntriesInput,
    @Context() ctx: GqlContext,
  ) {
    const searchRequest: EntriesSearchRequest = {
      dateRange: input.dateRange || [],
      titleOrNotes: input.titleOrNotes || '',
      activities: input.activities || [],
      lawnSegments: input.lawnSegments || [],
      products: input.products || [],
    };
    const result = await this.entriesService.searchEntries(
      ctx.req.user.userId,
      searchRequest,
      { raw: true },
    );

    return resultOrThrow(result);
  }

  @Mutation(() => Entry)
  async createEntry(
    @Args('input') input: CreateEntryInput,
    @Context() ctx: GqlContext,
  ): Promise<Entry> {
    const entryRequest = {
      ...input,
      activityIds: input.activityIds || [],
      lawnSegmentIds: input.lawnSegmentIds || [],
      products: (input.products || []).map((p) => ({
        productId: p.productId,
        productQuantity: p.productQuantity,
        productQuantityUnit: p.productQuantityUnit,
      })),
      imageUrls: input.imageUrls,
    } as EntryCreationRequest;
    return this.entriesService.createEntry(ctx.req.user.userId, entryRequest);
  }

  @Mutation(() => Entry)
  async updateEntry(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateEntryInput,
  ): Promise<Entry> {
    const result = await this.entriesService.updateEntry(id, {
      ...input,
      activityIds: input.activityIds || [],
      lawnSegmentIds: input.lawnSegmentIds || [],
      products: (input.products || []).map((p) => ({
        productId: p.productId,
        productQuantity: p.productQuantity,
        productQuantityUnit: p.productQuantityUnit,
      })),
      imageUrls: input.imageUrls,
    });

    return resultOrThrow(result);
  }

  @Mutation(() => Boolean)
  async deleteEntry(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.entriesService.softDeleteEntry(id);

    return true;
  }

  @Mutation(() => Boolean)
  async recoverEntry(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.entriesService.recoverEntry(id);

    return true;
  }

  @Mutation(() => Boolean)
  async deleteEntryImage(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.entriesService.softDeleteEntryImage(id);

    return true;
  }

  @Mutation(() => Boolean)
  async recoverEntryImage(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.entriesService.recoverEntryImage(id);

    return true;
  }
}
