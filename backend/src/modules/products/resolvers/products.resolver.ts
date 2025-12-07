import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Product } from '../models/products.model';
import { ProductsService } from '../services/products.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import { CreateProductInput, ProductWithHidden } from './products.inputs';
import { GqlContext } from '../../../types/gql-context';

@Resolver(() => Product)
@UseGuards(GqlAuthGuard)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [ProductWithHidden], { name: 'products' })
  async getProducts(
    @Context() ctx: GqlContext,
    @Args('userOnly', { nullable: true }) userOnly?: boolean,
    @Args('systemOnly', { nullable: true }) systemOnly?: boolean,
  ): Promise<ProductWithHidden[]> {
    return this.productsService.getProducts(ctx.req.user.userId, {
      userOnly,
      systemOnly,
    });
  }

  @Mutation(() => Product)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @Context() ctx: GqlContext,
  ): Promise<Product> {
    return this.productsService.addProduct({
      ...input,
      userId: ctx.req.user.userId,
    } as Product);
  }

  @Mutation(() => Boolean)
  async hideProduct(
    @Args('productId', { type: () => Int }) productId: number,
    @Context() ctx: GqlContext,
  ): Promise<boolean> {
    await this.productsService.hideProduct(ctx.req.user.userId, productId);

    return true;
  }

  @Mutation(() => Boolean)
  async unhideProduct(
    @Args('productId', { type: () => Int }) productId: number,
    @Context() ctx: GqlContext,
  ): Promise<boolean> {
    await this.productsService.unhideProduct(ctx.req.user.userId, productId);

    return true;
  }
}
