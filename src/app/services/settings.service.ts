import { inject, Injectable, linkedSignal } from '@angular/core';
import { apiUrl, putReq } from '../utils/httpUtils';
import { httpResource } from '@angular/common/http';
import { injectUserData } from '../utils/authUtils';
import {
  SettingsData,
  SettingsResponse
} from '../../../backend/src/settings/models/settings.types';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public user = injectUserData();

  public userId = linkedSignal(() => this.user()?.sub || '');

  public settings = httpResource<SettingsResponse>(() =>
    this.userId() ? apiUrl('settings', { params: [this.userId()] }) : undefined
  );

  public currentSettings = linkedSignal(() => this.settings.value()?.value);

  public updateSetting = <
    TKey extends keyof SettingsData,
    TValue extends SettingsData[TKey]
  >(
    settingName: TKey,
    newValue: TValue
  ): void => {
    const updatedSettings: SettingsData = {
      ...this.currentSettings()!,
      [settingName]: newValue
    };

    putReq<SettingsData>(
      apiUrl('settings', { params: [this.userId()] }),
      updatedSettings
    ).subscribe({
      next: (updatedSettingsRes) =>
        this.currentSettings.update((currSettings) => ({
          ...currSettings,
          ...updatedSettingsRes
        }))
    });
  };
}

export const injectSettingsService = () => inject(SettingsService);
