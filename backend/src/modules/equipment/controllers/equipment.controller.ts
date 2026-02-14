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
import { resultOrThrow } from '../../../utils/unwrapResult';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('equipment')
export class EquipmentController {
  constructor(
    private readonly _equipmentService: EquipmentService,
    private readonly _s3Service: S3Service,
  ) {}

  @Get()
  public getAllUserEquipment(@User('userId') userId: string) {
    LogHelpers.addBusinessContext('controller_operation', 'get_all_equipment');
    LogHelpers.addBusinessContext('user_id', userId);

    return this._equipmentService.getAllUserEquipment(userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('equipment-image'))
  public async createEquipment(
    @User('userId') userId: string,
    @UploadedFile(imageFileValidator()) file: Express.Multer.File,
    @Body() equipmentData: Partial<Equipment>,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'create_equipment');
    LogHelpers.addBusinessContext('user_id', userId);

    let imageUrl: string | undefined;

    if (file) {
      imageUrl = resultOrThrow(await this._s3Service.uploadFile(file, userId));
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
    LogHelpers.addBusinessContext('controller_operation', 'update_equipment');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('equipment_id', equipmentId);

    let imageUrl: string | undefined;

    if (file) {
      imageUrl = resultOrThrow(await this._s3Service.uploadFile(file, userId));
    }

    const result = await this._equipmentService.updateEquipment(equipmentId, {
      ...equipmentData,
      imageUrl,
    });

    return resultOrThrow(result);
  }

  @Put(':equipmentId/archive-status')
  public async toggleEquipmentArchiveStatus(
    @Param('equipmentId') equipmentId: number,
    @Query('isActive') isActive: boolean,
  ) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'toggle_archive_status',
    );
    LogHelpers.addBusinessContext('equipment_id', equipmentId);
    LogHelpers.addBusinessContext('is_active', isActive);

    const result = await this._equipmentService.toggleEquipmentArchiveStatus(
      equipmentId,
      isActive,
    );

    return resultOrThrow(result);
  }

  @Post(':equipmentId/maintenance')
  public async createMaintenanceRecord(
    @Param('equipmentId') equipmentId: number,
    @Body() maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'create_maintenance_record',
    );
    LogHelpers.addBusinessContext('equipment_id', equipmentId);

    const result = await this._equipmentService.createMaintenanceRecord(
      equipmentId,
      maintenanceData,
    );

    return resultOrThrow(result);
  }

  @Put('maintenance/:maintenanceId')
  public async updateMaintenanceRecord(
    @Param('maintenanceId') maintenanceId: number,
    @Body() maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'update_maintenance_record',
    );
    LogHelpers.addBusinessContext('maintenance_id', maintenanceId);

    const result = await this._equipmentService.updateMaintenanceRecord(
      maintenanceId,
      maintenanceData,
    );

    return resultOrThrow(result);
  }

  @Delete(':equipmentId')
  public async deleteEquipment(@Param('equipmentId') equipmentId: number) {
    LogHelpers.addBusinessContext('controller_operation', 'delete_equipment');
    LogHelpers.addBusinessContext('equipment_id', equipmentId);

    const result = await this._equipmentService.deleteEquipment(equipmentId);

    return resultOrThrow(result);
  }

  @Delete('maintenance/:maintenanceId')
  public async deleteMaintenanceRecord(
    @Param('maintenanceId') maintenanceId: number,
  ) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'delete_maintenance_record',
    );
    LogHelpers.addBusinessContext('maintenance_id', maintenanceId);

    const result =
      await this._equipmentService.deleteMaintenanceRecord(maintenanceId);

    return resultOrThrow(result);
  }
}
