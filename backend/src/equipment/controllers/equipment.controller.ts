import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
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
import { EquipmentMaintenance } from '../models/equipmentMaintenance.model';

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

  @Put(':equipmentId')
  @UseInterceptors(FileInterceptor('equipment-image'))
  async updateEquipment(
    @Req() req: Request,
    @Param('equipmentId') equipmentId: number,
    @UploadedFile(imageFileValidator) file: Express.Multer.File,
    @Body() equipmentData: Partial<Equipment>,
  ) {
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

    return this._equipmentService.updateEquipment(equipmentId, {
      ...equipmentData,
      imageUrl,
    });
  }

  @Put(':equipmentId')
  toggleEquipmentArchiveStatus(
    @Param('equipmentId') equipmentId: number,
    @Query('isActive') isActive: boolean,
  ) {
    return this._equipmentService.toggleEquipmentArchiveStatus(
      equipmentId,
      isActive,
    );
  }

  @Post(':equipmentId/maintenance')
  createMaintenanceRecord(
    @Param('equipmentId') equipmentId: number,
    @Body() maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    return this._equipmentService.createMaintenanceRecord(
      equipmentId,
      maintenanceData,
    );
  }

  @Put('maintenance/:maintenanceId')
  updateMaintenanceRecord(
    @Param('maintenanceId') maintenanceId: number,
    @Body() maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    return this._equipmentService.updateMaintenanceRecord(
      maintenanceId,
      maintenanceData,
    );
  }

  @Delete(':equipmentId')
  deleteEquipment(@Param('equipmentId') equipmentId: number) {
    return this._equipmentService.deleteEquipment(equipmentId);
  }

  @Delete('maintenance/:maintenanceId')
  deleteMaintenanceRecord(@Param('maintenanceId') maintenanceId: number) {
    return this._equipmentService.deleteMaintenanceRecord(maintenanceId);
  }
}
