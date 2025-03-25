import {
  Body,
  Controller,
  Get,
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
import { Public } from 'src/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(
    private _s3Service: S3Service,
    private _productsService: ProductsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('product-image'))
  @Public()
  async addProduct(
    @UploadedFile(imageFileValidator) file: Express.Multer.File,
    @Body() body: { userId: string },
  ) {
    // just uploading the file for now
    const imageUrl = await this._s3Service.uploadFile(file, body.userId);

    return imageUrl;
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
