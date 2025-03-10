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
  _ = effect(() => {
    console.log(this.userId());
  });

  public userId = computed(() => this.user()?.sub);

  public settings = httpResource<Settings>(() =>
    apiUrl('settings', { params: [this.userId()!] })
  );

  public currentSettings = linkedSignal(() => this.settings.value());

  public updateSetting<
    TKey extends keyof Settings,
    TValue extends Settings[TKey]
  >(settingName: TKey, newValue: TValue): void {
    const updatedSettings: Settings = {
      ...this.currentSettings(),
      [settingName]: newValue
    };

    console.log(this.userId());

    putReq<Settings>(
      apiUrl('settings', { params: [this.userId()!] }),
      updatedSettings
    ).subscribe({
      next: (res) =>
        this.currentSettings.update((currSettings) => ({
          ...currSettings,
          temperatureUnit: res.temperatureUnit
        }))
    });
  }
}

export const injectSettingsService = () => inject(SettingsService);
