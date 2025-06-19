import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from '../models/settings.model';
import { Repository } from 'typeorm';
import { SettingsData, SettingsResponse } from '../models/settings.types';
import { Stringified } from 'src/types/json-modified';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private _settingsRepo: Repository<Settings>,
  ) {}

  async getUserSettings(userId: string): Promise<SettingsResponse | []> {
    const settings = await this._settingsRepo.findOneBy({ userId });
    const settingsValue = settings?.value as Stringified<SettingsData>;

    if (!settings) return [];

    return {
      ...settings,
      value: JSON.parse(settingsValue),
    };
  }

  async updateSettings(
    userId: string,
    settings: Stringified<SettingsData>,
  ): Promise<SettingsData> {
    const userSettings = await this._settingsRepo.findBy({ userId });
    const newSettings = JSON.parse(settings);

    if (userSettings.length) {
      await this._settingsRepo.update({ userId }, { value: settings });
    } else {
      await this._settingsRepo.save({ value: settings, userId });
    }

    return newSettings;
  }
}
