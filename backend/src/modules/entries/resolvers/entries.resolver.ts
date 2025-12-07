import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Entry } from '../models/entries.model';
import { EntriesService } from '../services/entries.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import { CreateEntryInput, UpdateEntryInput, SearchEntriesInput } from './entries.inputs';

@Resolver(() => Entry)
@UseGuards(GqlAuthGuard)
export class EntriesResolver {
  constructor(private readonly entriesService: EntriesService) {}

  @Query(() => [Entry], { name: 'entries' })
  async getEntries(
    @Context() ctx: { user: { userId: string } },
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ) {
    return this.entriesService.getEntries(ctx.user.userId, startDate, endDate);
  }

  @Query(() => Entry, { name: 'entry', nullable: true })
  async getEntry(@Args('id', { type: () => Int }) id: number) {
    return this.entriesService.getEntry(id);
  }

  @Query(() => Entry, { name: 'entryByDate', nullable: true })
  async getEntryByDate(
    @Args('date') date: string,
    @Context() ctx: { user: { userId: string } },
  ) {
    return this.entriesService.getEntryByDate(ctx.user.userId, date);
  }

  @Query(() => Entry, { name: 'mostRecentEntry', nullable: true })
  async getMostRecentEntry(@Context() ctx: { user: { userId: string } }) {
    return this.entriesService.getMostRecentEntry(ctx.user.userId);
  }

  @Query(() => Date, { name: 'lastMowDate', nullable: true })
  async getLastMowDate(@Context() ctx: { user: { userId: string } }) {
    return this.entriesService.getLastMowDate(ctx.user.userId);
  }

  @Query(() => Date, { name: 'lastProductApplicationDate', nullable: true })
  async getLastProductApplicationDate(@Context() ctx: { user: { userId: string } }) {
    return this.entriesService.getLastProductApplicationDate(ctx.user.userId);
  }

  @Query(() => [Entry], { name: 'searchEntries' })
  async searchEntries(
    @Args('input') input: SearchEntriesInput,
    @Context() ctx: { user: { userId: string } },
  ) {
    return this.entriesService.searchEntries(ctx.user.userId, input);
  }

  @Mutation(() => Entry)
  async createEntry(
    @Args('input') input: CreateEntryInput,
    @Context() ctx: { user: { userId: string } },
  ): Promise<Entry> {
    return this.entriesService.createEntry(ctx.user.userId, {
      ...input,
      products: input.products || [],
    });
  }

  @Mutation(() => Entry)
  async updateEntry(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateEntryInput,
  ): Promise<Entry> {
    return this.entriesService.updateEntry(id, {
      ...input,
      products: input.products || [],
    });
  }

  @Mutation(() => Boolean)
  async deleteEntry(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.entriesService.softDeleteEntry(id);

    return true;
  }

  @Mutation(() => Boolean)
  async recoverEntry(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.entriesService.recoverEntry(id);

    return true;
  }

  @Mutation(() => Boolean)
  async deleteEntryImage(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.entriesService.softDeleteEntryImage(id);

    return true;
  }

  @Mutation(() => Boolean)
  async recoverEntryImage(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.entriesService.recoverEntryImage(id);
    
    return true;
  }
}