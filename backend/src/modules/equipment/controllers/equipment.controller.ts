import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EquipmentService } from '../services/equipment.service';
import { Equipment } from '../models/equipment.model';
import { imageFileValidator } from 'src/utils/fileUtils';
import { S3Service } from 'src/modules/s3/s3.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { EquipmentMaintenance } from '../models/equipmentMaintenance.model';
import { unwrapResult } from '../../../utils/unwrapResult';
import { User } from '../../../decorators/user.decorator';

@Controller('equipment')
export class EquipmentController {
  constructor(
    private readonly _equipmentService: EquipmentService,
    private readonly _s3Service: S3Service,
  ) {}

  @Get()
  public getAllUserEquipment(@User('userId') userId: string) {
    return this._equipmentService.getAllUserEquipment(userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('equipment-image'))
  public async createEquipment(
    @User('userId') userId: string,
    @UploadedFile(imageFileValidator()) file: Express.Multer.File,
    @Body() equipmentData: Partial<Equipment>,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      imageUrl = unwrapResult(await this._s3Service.uploadFile(file, userId));
    }

    return this._equipmentService.createEquipment(userId, {
      ...equipmentData,
      imageUrl,
    });
  }

  @Put(':equipmentId')
  @UseInterceptors(FileInterceptor('equipment-image'))
  public async updateEquipment(
    @User('userId') userId: string,
    @Param('equipmentId') equipmentId: number,
    @UploadedFile(imageFileValidator()) file: Express.Multer.File,
    @Body() equipmentData: Partial<Equipment>,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      imageUrl = unwrapResult(await this._s3Service.uploadFile(file, userId));
    }

    const result = await this._equipmentService.updateEquipment(equipmentId, {
      ...equipmentData,
      imageUrl,
    });

    return unwrapResult(result);
  }

  @Put(':equipmentId')
  public async toggleEquipmentArchiveStatus(
    @Param('equipmentId') equipmentId: number,
    @Query('isActive') isActive: boolean,
  ) {
    const result = await this._equipmentService.toggleEquipmentArchiveStatus(
      equipmentId,
      isActive,
    );

    return unwrapResult(result);
  }

  @Post(':equipmentId/maintenance')
  public async createMaintenanceRecord(
    @Param('equipmentId') equipmentId: number,
    @Body() maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    const result = await this._equipmentService.createMaintenanceRecord(
      equipmentId,
      maintenanceData,
    );

    return unwrapResult(result);
  }

  @Put('maintenance/:maintenanceId')
  public async updateMaintenanceRecord(
    @Param('maintenanceId') maintenanceId: number,
    @Body() maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    const result = await this._equipmentService.updateMaintenanceRecord(
      maintenanceId,
      maintenanceData,
    );

    return unwrapResult(result);
  }

  @Delete(':equipmentId')
  public async deleteEquipment(@Param('equipmentId') equipmentId: number) {
    const result = await this._equipmentService.deleteEquipment(equipmentId);

    return unwrapResult(result);
  }

  @Delete('maintenance/:maintenanceId')
  public async deleteMaintenanceRecord(
    @Param('maintenanceId') maintenanceId: number,
  ) {
    const result =
      await this._equipmentService.deleteMaintenanceRecord(maintenanceId);

    return unwrapResult(result);
  }
}
