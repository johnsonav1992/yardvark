import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private _settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this._settingsService.getSettings();
  }
}
