import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { SettingsData } from '../models/settings.types';
import { User } from '../../../decorators/user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly _settingsService: SettingsService) {}

  @Get()
  public getSettings(@User('userId') userId: string) {
    return this._settingsService.getUserSettings(userId);
  }

  @Put()
  public updateSettings(
    @User('userId') userId: string,
    @Body() settings: SettingsData,
  ) {
    const settingsVal = JSON.stringify(settings);

    return this._settingsService.updateSettings(userId, settingsVal);
  }
}
