import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from '../models/settings.model';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private _settingsRepo: Repository<Settings>,
  ) {}

  getSettings(userId: string) {
    return this._settingsRepo.findOneBy({ userId });
  }

  async updateSettings(userId: string, settings: string) {
    const userSettings = await this._settingsRepo.findBy({ userId });

    console.log(userSettings);

    if (userSettings.length) {
      return this._settingsRepo.update({ userId }, { value: settings });
    }

    return this._settingsRepo.save({ value: settings, userId });
  }
}
