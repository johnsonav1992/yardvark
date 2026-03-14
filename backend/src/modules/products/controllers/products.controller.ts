import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	NotFoundException,
	Param,
	Post,
	Put,
	UnauthorizedException,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { S3Service } from "src/modules/s3/s3.service";
import {
	imageFileValidator,
	validateImageMagicBytes,
} from "src/utils/fileUtils";
import { Public } from "../../../decorators/public.decorator";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import type { Product } from "../models/products.model";
import { ProductsService } from "../services/products.service";

@Controller("products")
export class ProductsController {
	constructor(
		private readonly _s3Service: S3Service,
		private readonly _productsService: ProductsService,
	) {}

	@Post()
	@UseInterceptors(FileInterceptor("product-image"))
	public async addProduct(
		@User("userId") userId: string,
		@User("isMaster") isMaster: boolean,
		@UploadedFile(imageFileValidator()) file: Express.Multer.File,
		@Body() body: Product & { systemProduct?: string | boolean },
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"create_product",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		const isSystemProduct = isMaster && body.systemProduct === "true";

		let imageUrl: string | undefined;

		if (file) {
			validateImageMagicBytes(file);
			imageUrl = resultOrThrow(await this._s3Service.uploadFile(file, userId));
		}

		return this._productsService.addProduct({
			...body,
			userId: isSystemProduct ? "system" : userId,
			imageUrl,
		});
	}

	@Get()
	public getProducts(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_products",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return this._productsService.getProducts(userId);
	}

	@Get("user-only")
	public getUserProducts(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_user_products",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return this._productsService.getProducts(userId, {
			userOnly: true,
		});
	}

	/**
	 * Quick endpoint for updating product images by admin users
	 * without needing to log into the app.
	 */
	@Public()
	@Put("system-image/:productId")
	@UseInterceptors(FileInterceptor("product-image"))
	public async updateSystemProductImage(
		@Param("productId") productId: number,
		@UploadedFile(imageFileValidator()) file: Express.Multer.File,
		@Body("password") password: string,
		@Body("imageCredit") imageCredit: string | undefined,
	) {
		if (!password || password !== process.env.ADMIN_API_PASSWORD) {
			throw new UnauthorizedException();
		}

		if (!file) {
			throw new BadRequestException("Image file is required");
		}

		const product = await this._productsService.getProductById(productId);

		if (!product) {
			throw new NotFoundException("Product not found");
		}

		if (product.userId !== "system") {
			throw new ForbiddenException("Product is not a system product");
		}

		validateImageMagicBytes(file);

		const imageUrl = resultOrThrow(
			await this._s3Service.uploadFile(file, "system"),
		);

		return this._productsService.updateProduct(productId, { imageUrl, imageCredit });
	}

	@Put("hide/:productId")
	public hideProduct(
		@User("userId") userId: string,
		@Param("productId") productId: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"hide_product",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.productId, productId);

		return this._productsService.hideProduct(userId, productId);
	}

	@Put("unhide/:productId")
	public unhideProduct(
		@User("userId") userId: string,
		@Param("productId") productId: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"unhide_product",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.productId, productId);

		return this._productsService.unhideProduct(userId, productId);
	}
}
