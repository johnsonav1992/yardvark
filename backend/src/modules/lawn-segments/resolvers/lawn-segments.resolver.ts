import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LawnSegment } from '../models/lawn-segments.model';
import { LawnSegmentsService } from '../services/lawn-segments.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import { CreateLawnSegmentInput, UpdateLawnSegmentInput } from './lawn-segments.inputs';

@Resolver(() => LawnSegment)
@UseGuards(GqlAuthGuard)
export class LawnSegmentsResolver {
  constructor(private readonly lawnSegmentsService: LawnSegmentsService) {}

  @Query(() => [LawnSegment], { name: 'lawnSegments' })
  async getLawnSegments(@Context() ctx: { user: { userId: string } }): Promise<LawnSegment[]> {
    return this.lawnSegmentsService.getLawnSegments(ctx.user.userId);
  }

  @Mutation(() => LawnSegment)
  async createLawnSegment(
    @Args('input') input: CreateLawnSegmentInput,
    @Context() ctx: { user: { userId: string } },
  ): Promise<LawnSegment> {
    return this.lawnSegmentsService.createLawnSegment(ctx.user.userId, input);
  }

  @Mutation(() => LawnSegment)
  async updateLawnSegment(
    @Args('input') input: UpdateLawnSegmentInput,
  ): Promise<LawnSegment> {
    return this.lawnSegmentsService.updateLawnSegment(input as LawnSegment);
  }

  @Mutation(() => Boolean)
  async deleteLawnSegment(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.lawnSegmentsService.deleteLawnSegment(id);
    return true;
  }
}
