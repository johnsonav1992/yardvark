import { computed, inject, Injectable } from '@angular/core';
import { beUrl, putReq } from '../utils/httpUtils';
import { Settings } from '../types/settings.types';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public settings = httpResource<Settings>(beUrl('settings'));

  public currentSettings = computed(() => this.settings.value());

  public updateSetting<
    TKey extends keyof Settings,
    TValue extends Settings[TKey]
  >(settingName: TKey, newValue: TValue): void {
    const updatedSettings: Settings = {
      ...this.currentSettings(),
      [settingName]: newValue
    };

    putReq<Settings>(beUrl('settings'), updatedSettings).subscribe();
  }
}

export const injectSettingsService = () => inject(SettingsService);
