import {
  Body,
  Controller,
  Delete,
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
import { imageFileValidator } from 'src/utils/fileUtils';
import { S3Service } from 'src/s3/s3.service';
import { tryCatch } from 'src/utils/tryCatch';
import { FileInterceptor } from '@nestjs/platform-express';
import { EquipmentMaintenance } from '../models/equipmentMaintainence.model';

@Controller('equipment')
export class EquipmentController {
  constructor(
    private readonly _equipmentService: EquipmentService,
    private readonly _s3Service: S3Service,
  ) {}

  @Get()
  getAllUserEquipment(@Req() req: Request) {
    const userId = req.user.userId;

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

  @Post('maintenance/:equipmentId')
  createMaintenanceRecord(
    @Param('equipmentId') equipmentId: number,
    @Body() maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    return this._equipmentService.createMaintenanceRecord(
      equipmentId,
      maintenanceData,
    );
  }

  @Delete('maintenance/:maintenanceId')
  deleteMaintenanceRecord(@Param('maintenanceId') maintenanceId: number) {
    return this._equipmentService.deleteMaintenanceRecord(maintenanceId);
  }
}
