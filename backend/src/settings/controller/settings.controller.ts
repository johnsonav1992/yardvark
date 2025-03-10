import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { SettingsService } from '../service/settings.service';
import { SettingsData } from '../models/settings.types';

@Controller('settings')
export class SettingsController {
  constructor(private _settingsService: SettingsService) {}

  @Get(':userId')
  getSettings(@Param('userId') userId: string) {
    return this._settingsService.getUserSettings(userId);
  }

  @Put(':userId')
  updateSettings(
    @Param('userId') userId: string,
    @Body() settings: SettingsData,
  ) {
    const settingsVal = JSON.stringify(settings);
    return this._settingsService.updateSettings(userId, settingsVal);
  }
}
