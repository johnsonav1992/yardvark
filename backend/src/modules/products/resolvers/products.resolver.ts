import { UseGuards } from "@nestjs/common";
import { Args, Context, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GqlAuthGuard } from "../../../guards/gql-auth.guard";
import type { GqlContext } from "../../../types/gql-context";
import { Product } from "../models/products.model";
import { ProductsService } from "../services/products.service";
import {
	CreateProductInput,
	ProductWithHidden,
	UpdateProductInput,
} from "./products.inputs";

@Resolver(() => Product)
@UseGuards(GqlAuthGuard)
export class ProductsResolver {
	constructor(private readonly productsService: ProductsService) {}

	@Query(() => [ProductWithHidden], { name: "products" })
	async getProducts(
		@Context() ctx: GqlContext,
		@Args("userOnly", { nullable: true }) userOnly?: boolean,
		@Args("systemOnly", { nullable: true }) systemOnly?: boolean,
	): Promise<ProductWithHidden[]> {
		return this.productsService.getProducts(ctx.req.user.userId, {
			userOnly,
			systemOnly,
		});
	}

	@Query(() => Product, { name: "productById", nullable: true })
	async getProductById(
		@Args("id", { type: () => Int }) id: number,
	): Promise<Product | null> {
		return this.productsService.getProductById(id);
	}

	@Mutation(() => Product)
	async createProduct(
		@Args("input") input: CreateProductInput,
		@Context() ctx: GqlContext,
	): Promise<Product> {
		return this.productsService.addProduct({
			...input,
			userId: ctx.req.user.userId,
		} as Product);
	}

	@Mutation(() => Product, { nullable: true })
	async updateProduct(
		@Args("id", { type: () => Int }) id: number,
		@Args("input") input: UpdateProductInput,
	): Promise<Product | null> {
		return this.productsService.updateProduct(id, input);
	}

	@Mutation(() => Boolean)
	async hideProduct(
		@Args("productId", { type: () => Int }) productId: number,
		@Context() ctx: GqlContext,
	): Promise<boolean> {
		await this.productsService.hideProduct(ctx.req.user.userId, productId);

		return true;
	}

	@Mutation(() => Boolean)
	async unhideProduct(
		@Args("productId", { type: () => Int }) productId: number,
		@Context() ctx: GqlContext,
	): Promise<boolean> {
		await this.productsService.unhideProduct(ctx.req.user.userId, productId);

		return true;
	}
}
