import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  getSettings() {
    return 'Settings';
  }
}
