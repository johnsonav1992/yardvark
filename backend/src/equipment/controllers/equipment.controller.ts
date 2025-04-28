import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { EquipmentService } from '../services/equipment.service';
import { Equipment } from '../models/equipment.model';
import { Public } from 'src/decorators/public.decorator';
import { imageFileValidator } from 'src/utils/fileUtils';
import { S3Service } from 'src/s3/s3.service';
import { tryCatch } from 'src/utils/tryCatch';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('equipment')
export class EquipmentController {
  constructor(
    private readonly _equipmentService: EquipmentService,
    private readonly _s3Service: S3Service,
  ) {}

  @Get(':userId')
  @Public()
  getAllUserEquipment(@Param('userId') userId: string) {
    // const userId = req.user.userId;

    return this._equipmentService.getAllUserEquipment(userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('equipment-image'))
  async createEquipment(
    @Req() req: Request,
    @UploadedFile(imageFileValidator) file: Express.Multer.File,
    @Body() equipmentData: Partial<Equipment>,
  ) {
    const userId = req.user.userId;

    let imageUrl: string | undefined = undefined;

    if (file) {
      const { data, error } = await tryCatch(() =>
        this._s3Service.uploadFile(file, req.user.userId),
      );

      imageUrl = data || undefined;

      if (error) {
        throw new HttpException(
          `Error uploading file to S3 - ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return this._equipmentService.createEquipment(userId, {
      ...equipmentData,
      imageUrl,
    });
  }
}
