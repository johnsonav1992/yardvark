import { inject, Injectable, linkedSignal } from '@angular/core';
import { apiUrl, putReq } from '../utils/httpUtils';
import { Settings } from '../types/settings.types';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public settings = httpResource<Settings>(apiUrl('settings'));

  public currentSettings = linkedSignal(() => this.settings.value());

  public updateSetting<
    TKey extends keyof Settings,
    TValue extends Settings[TKey]
  >(settingName: TKey, newValue: TValue): void {
    const updatedSettings: Settings = {
      ...this.currentSettings(),
      [settingName]: newValue
    };

    putReq<Settings>(apiUrl('settings'), updatedSettings).subscribe({
      next: (res) =>
        this.currentSettings.update((currSettings) => ({
          ...currSettings,
          temperatureUnit: res.temperatureUnit
        }))
    });
  }
}

export const injectSettingsService = () => inject(SettingsService);
