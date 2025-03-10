import {
  computed,
  effect,
  inject,
  Injectable,
  linkedSignal
} from '@angular/core';
import { apiUrl, putReq } from '../utils/httpUtils';
import { Settings } from '../types/settings.types';
import { httpResource } from '@angular/common/http';
import { injectUserData } from '../utils/authUtils';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public user = injectUserData();

  public userId = computed(() => this.user()?.sub);

  public settings = httpResource<Settings>(() =>
    apiUrl('settings', { params: [this.userId()!] })
  );

  public currentSettings = linkedSignal(() => {
    if (!this.settings.value()) return {} as Settings;
    return JSON.parse(this.settings.value()!.value as string);
  });

  public updateSetting<
    TKey extends keyof Settings,
    TValue extends Settings[TKey]
  >(settingName: TKey, newValue: TValue): void {
    const updatedSettings: Settings = {
      ...this.currentSettings(),
      [settingName]: newValue
    };

    putReq<Settings>(
      apiUrl('settings', { params: ['google-oauth2|111643664660289512636'] }),
      updatedSettings
    ).subscribe({
      next: (res) =>
        this.currentSettings.update((currSettings) => ({
          ...currSettings,
          ...updatedSettings
        }))
    });
  }
}

export const injectSettingsService = () => inject(SettingsService);
