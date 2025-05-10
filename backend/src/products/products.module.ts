import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { S3Service } from 'src/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './models/products.model';
import { UserHiddenProduct } from './models/userHiddenProducts';

@Module({
  imports: [TypeOrmModule.forFeature([Product, UserHiddenProduct])],
  controllers: [ProductsController],
  providers: [ProductsService, S3Service, ConfigService],
})
export class ProductsModule {}
