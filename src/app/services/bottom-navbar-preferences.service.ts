import { computed, inject, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
}

const DEFAULT_BOTTOM_NAV_ITEMS: string[] = [
  'dashboard',
  'entry-log',
  'products',
  'analytics'
];

@Injectable({
  providedIn: 'root'
})
export class BottomNavbarPreferencesService {
  private _settingsService = inject(SettingsService);

  public selectedItemIds = computed(() => {
    const settings = this._settingsService.currentSettings();
    return settings?.mobileNavbarItems?.length === 4
      ? settings.mobileNavbarItems
      : DEFAULT_BOTTOM_NAV_ITEMS;
  });

  public updateSelectedItems(itemIds: string[]): void {
    if (itemIds.length !== 4) {
      return;
    }
    this._settingsService.updateSetting('mobileNavbarItems', itemIds);
  }
}
