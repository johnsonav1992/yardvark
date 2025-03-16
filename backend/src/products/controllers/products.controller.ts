import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';
import { Stringified } from 'src/types/json-modified';
import { imageFileValidator } from 'src/utils/fileUtils';

@Controller('products')
export class ProductsController {
  constructor(private _s3Service: S3Service) {}

  @Post()
  @UseInterceptors(FileInterceptor('product-image'))
  async addProduct(
    @UploadedFile(imageFileValidator)
    file: Express.Multer.File,
    @Body('body') body: Stringified<{ userId: string }>,
  ) {
    const userId = JSON.parse(body).userId;

    // just uploading the file for now
    const imageUrl = await this._s3Service.uploadFile(file, userId);
  }
}
