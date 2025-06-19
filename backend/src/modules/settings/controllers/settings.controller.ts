import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { SettingsData } from '../models/settings.types';
import { Request } from 'express';

@Controller('settings')
export class SettingsController {
  constructor(private _settingsService: SettingsService) {}

  @Get()
  getSettings(@Req() req: Request) {
    return this._settingsService.getUserSettings(req.user.userId);
  }

  @Put()
  updateSettings(@Req() req: Request, @Body() settings: SettingsData) {
    const settingsVal = JSON.stringify(settings);
    return this._settingsService.updateSettings(req.user.userId, settingsVal);
  }
}
