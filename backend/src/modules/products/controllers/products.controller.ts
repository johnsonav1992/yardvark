import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/modules/s3/s3.service';
import { imageFileValidator } from 'src/utils/fileUtils';
import { ProductsService } from '../services/products.service';
import { Request } from 'express';
import { unwrapResult } from '../../../utils/unwrapResult';
import { Product } from '../models/products.model';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly _s3Service: S3Service,
    private readonly _productsService: ProductsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('product-image'))
  public async addProduct(
    @Req() req: Request,
    @UploadedFile(imageFileValidator()) file: Express.Multer.File,
    @Body() body: Product & { systemProduct?: string | boolean },
  ) {
    if (body.systemProduct) body.systemProduct = body.systemProduct === 'true';

    let imageUrl: string | undefined;

    if (file) {
      imageUrl = unwrapResult(
        await this._s3Service.uploadFile(file, req.user.userId),
      );
    }

    return this._productsService.addProduct({
      ...body,
      userId: body.systemProduct ? 'system' : req.user.userId,
      imageUrl,
    });
  }

  @Get()
  public getProducts(@Req() req: Request) {
    return this._productsService.getProducts(req.user.userId);
  }

  @Get('user-only')
  public getUserProducts(@Req() req: Request) {
    return this._productsService.getProducts(req.user.userId, {
      userOnly: true,
    });
  }

  @Put('hide/:productId')
  public hideProduct(
    @Req() req: Request,
    @Param('productId') productId: number,
  ) {
    return this._productsService.hideProduct(req.user.userId, productId);
  }

  @Put('unhide/:productId')
  public unhideProduct(
    @Req() req: Request,
    @Param('productId') productId: number,
  ) {
    return this._productsService.unhideProduct(req.user.userId, productId);
  }
}
