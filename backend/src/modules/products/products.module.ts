import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { ProductsResolver } from './resolvers/products.resolver';
import { S3Service } from 'src/modules/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './models/products.model';
import { UserHiddenProduct } from './models/userHiddenProducts.model';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Product, UserHiddenProduct]), HttpModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsResolver, S3Service, ConfigService],
})
export class ProductsModule {}
