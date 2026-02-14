import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/modules/s3/s3.service';
import { imageFileValidator } from 'src/utils/fileUtils';
import { ProductsService } from '../services/products.service';
import { unwrapResult } from '../../../utils/unwrapResult';
import { Product } from '../models/products.model';
import { User } from '../../../decorators/user.decorator';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly _s3Service: S3Service,
    private readonly _productsService: ProductsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('product-image'))
  public async addProduct(
    @User('userId') userId: string,
    @UploadedFile(imageFileValidator()) file: Express.Multer.File,
    @Body() body: Product & { systemProduct?: string | boolean },
  ) {
    if (body.systemProduct) body.systemProduct = body.systemProduct === 'true';

    let imageUrl: string | undefined;

    if (file) {
      imageUrl = unwrapResult(await this._s3Service.uploadFile(file, userId));
    }

    return this._productsService.addProduct({
      ...body,
      userId: body.systemProduct ? 'system' : userId,
      imageUrl,
    });
  }

  @Get()
  public getProducts(@User('userId') userId: string) {
    return this._productsService.getProducts(userId);
  }

  @Get('user-only')
  public getUserProducts(@User('userId') userId: string) {
    return this._productsService.getProducts(userId, {
      userOnly: true,
    });
  }

  @Put('hide/:productId')
  public hideProduct(
    @User('userId') userId: string,
    @Param('productId') productId: number,
  ) {
    return this._productsService.hideProduct(userId, productId);
  }

  @Put('unhide/:productId')
  public unhideProduct(
    @User('userId') userId: string,
    @Param('productId') productId: number,
  ) {
    return this._productsService.unhideProduct(userId, productId);
  }
}
