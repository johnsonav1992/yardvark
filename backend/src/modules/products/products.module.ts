import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { S3Service } from "src/modules/s3/s3.service";
import { ProductsController } from "./controllers/products.controller";
import { Product } from "./models/products.model";
import { UserHiddenProduct } from "./models/userHiddenProducts.model";
import { ProductsResolver } from "./resolvers/products.resolver";
import { ProductsService } from "./services/products.service";

@Module({
	imports: [TypeOrmModule.forFeature([Product, UserHiddenProduct]), HttpModule],
	controllers: [ProductsController],
	providers: [ProductsService, ProductsResolver, S3Service, ConfigService],
	exports: [ProductsService],
})
export class ProductsModule {}
