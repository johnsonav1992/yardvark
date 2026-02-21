import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { SettingsData } from '../models/settings.types';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';

@Controller('settings')
export class SettingsController {
  constructor(private readonly _settingsService: SettingsService) {}

  @Get()
  public getSettings(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'get_settings',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    return this._settingsService.getUserSettings(userId);
  }

  @Put()
  public updateSettings(
    @User('userId') userId: string,
    @Body() settings: SettingsData,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'update_settings',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    const settingsVal = JSON.stringify(settings);

    return this._settingsService.updateSettings(userId, settingsVal);
  }
}
