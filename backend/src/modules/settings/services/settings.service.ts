import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from '../models/settings.model';
import { Repository } from 'typeorm';
import { SettingsData, SettingsResponse } from '../models/settings.types';
import { Stringified } from 'src/types/json-modified';
import { LogHelpers } from '../../../logger/logger.helpers';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private _settingsRepo: Repository<Settings>,
  ) {}

  async getUserSettings(userId: string): Promise<SettingsResponse | []> {
    const settings = await LogHelpers.withDatabaseTelemetry(() =>
      this._settingsRepo.findOneBy({ userId }),
    );
    const settingsValue = settings?.value as Stringified<SettingsData>;

    if (!settings) {
      LogHelpers.addBusinessContext('settingsFound', false);
      return [];
    }

    LogHelpers.addBusinessContext('settingsFound', true);

    return {
      ...settings,
      value: JSON.parse(settingsValue),
    };
  }

  async updateSettings(
    userId: string,
    settings: Stringified<SettingsData>,
  ): Promise<SettingsData> {
    const userSettings = await LogHelpers.withDatabaseTelemetry(() =>
      this._settingsRepo.findBy({ userId }),
    );
    const newSettings = JSON.parse(settings);

    if (userSettings.length) {
      await LogHelpers.withDatabaseTelemetry(() =>
        this._settingsRepo.update({ userId }, { value: settings }),
      );
      LogHelpers.addBusinessContext('settingsUpdated', true);
    } else {
      await LogHelpers.withDatabaseTelemetry(() =>
        this._settingsRepo.save({ value: settings, userId }),
      );
      LogHelpers.addBusinessContext('settingsCreated', true);
    }

    return newSettings;
  }
}
