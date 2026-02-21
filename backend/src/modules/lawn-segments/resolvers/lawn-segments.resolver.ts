import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LawnSegment } from '../models/lawn-segments.model';
import { LawnSegmentsService } from '../services/lawn-segments.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import {
  CreateLawnSegmentInput,
  UpdateLawnSegmentInput,
} from './lawn-segments.inputs';
import { GqlContext } from '../../../types/gql-context';
import { resultOrThrow } from '../../../utils/resultOrThrow';

@Resolver(() => LawnSegment)
@UseGuards(GqlAuthGuard)
export class LawnSegmentsResolver {
  constructor(private readonly lawnSegmentsService: LawnSegmentsService) {}

  @Query(() => [LawnSegment], { name: 'lawnSegments' })
  async getLawnSegments(@Context() ctx: GqlContext): Promise<LawnSegment[]> {
    return this.lawnSegmentsService.getLawnSegments(ctx.req.user.userId);
  }

  @Mutation(() => LawnSegment)
  async createLawnSegment(
    @Args('input') input: CreateLawnSegmentInput,
    @Context() ctx: GqlContext,
  ): Promise<LawnSegment> {
    return this.lawnSegmentsService.createLawnSegment(ctx.req.user.userId, {
      name: input.name,
      size: input.size,
      coordinates: input.coordinates ?? null,
      color: input.color ?? '#3388ff',
    });
  }

  @Mutation(() => LawnSegment)
  async updateLawnSegment(
    @Args('input') input: UpdateLawnSegmentInput,
  ): Promise<LawnSegment> {
    const { id, ...updateData } = input;
    const result = await this.lawnSegmentsService.updateLawnSegment(
      id,
      updateData,
    );

    return resultOrThrow(result);
  }

  @Mutation(() => Boolean)
  async deleteLawnSegment(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.lawnSegmentsService.deleteLawnSegment(id);
    return true;
  }
}
