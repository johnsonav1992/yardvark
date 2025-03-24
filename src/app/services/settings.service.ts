import { inject, Injectable, linkedSignal } from '@angular/core';
import { apiUrl, putReq } from '../utils/httpUtils';
import { httpResource } from '@angular/common/http';
import {
  SettingsData,
  SettingsResponse
} from '../../../backend/src/settings/models/settings.types';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public settings = httpResource<SettingsResponse>(() => apiUrl('settings'));

  public currentSettings = linkedSignal(() => ({
    ...this.settings.value()?.value!,
    locationAddress: 'something something'
  }));

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

    putReq<SettingsData>(apiUrl('settings'), updatedSettings).subscribe({
      next: (updatedSettingsRes) =>
        this.currentSettings.update((currSettings) => ({
          ...currSettings,
          ...updatedSettingsRes
        }))
    });
  };
}

export const injectSettingsService = () => inject(SettingsService);
