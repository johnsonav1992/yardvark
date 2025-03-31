import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';
import { imageFileValidator } from 'src/utils/fileUtils';
import { ProductsService } from '../services/products.service';
import { Request } from 'express';
import { tryCatch } from 'src/utils/tryCatch';
import { Product } from '../models/products.model';

@Controller('products')
export class ProductsController {
  constructor(
    private _s3Service: S3Service,
    private _productsService: ProductsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('product-image'))
  async addProduct(
    @Req() req: Request,
    @UploadedFile(imageFileValidator) file: Express.Multer.File,
    @Body() body: Product,
  ) {
    const { data: imageUrl, error } = await tryCatch(() =>
      this._s3Service.uploadFile(file, req.user.userId),
    );

    if (error) {
      throw new HttpException(
        `Error uploading file to S3 - ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this._productsService.addProduct({
      ...body,
      userId: req.user.userId,
      imageUrl: imageUrl || undefined,
    });
  }

  @Get()
  getProducts(@Req() req: Request) {
    return this._productsService.getProducts(req.user.userId);
  }

  @Get('user-only')
  getUserProducts(@Req() req: Request) {
    return this._productsService.getProducts(req.user.userId, {
      userOnly: true,
    });
  }
}
