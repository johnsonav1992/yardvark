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
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { Product } from '../models/products.model';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';

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
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'create_product',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    if (body.systemProduct) body.systemProduct = body.systemProduct === 'true';

    let imageUrl: string | undefined;

    if (file) {
      imageUrl = resultOrThrow(await this._s3Service.uploadFile(file, userId));
    }

    return this._productsService.addProduct({
      ...body,
      userId: body.systemProduct ? 'system' : userId,
      imageUrl,
    });
  }

  @Get()
  public getProducts(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'get_products',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    return this._productsService.getProducts(userId);
  }

  @Get('user-only')
  public getUserProducts(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'get_user_products',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    return this._productsService.getProducts(userId, {
      userOnly: true,
    });
  }

  @Put('hide/:productId')
  public hideProduct(
    @User('userId') userId: string,
    @Param('productId') productId: number,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'hide_product',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
    LogHelpers.addBusinessContext(BusinessContextKeys.productId, productId);

    return this._productsService.hideProduct(userId, productId);
  }

  @Put('unhide/:productId')
  public unhideProduct(
    @User('userId') userId: string,
    @Param('productId') productId: number,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'unhide_product',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
    LogHelpers.addBusinessContext(BusinessContextKeys.productId, productId);

    return this._productsService.unhideProduct(userId, productId);
  }
}
