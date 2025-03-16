import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileValidator } from 'src/utils/fileUtils';

@Controller('products')
export class ProductsController {
  constructor() {}

  @Post()
  @UseInterceptors(FileInterceptor('product-image'))
  uploadFile(
    @UploadedFile(imageFileValidator)
    file: Express.Multer.File,
    @Body() body: any,
  ) {
    console.log(file);
    console.log(body);
  }
}
