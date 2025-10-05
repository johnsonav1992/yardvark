import { Injectable, signal } from '@angular/core';

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

const STORAGE_KEY = 'yv-bottom-nav-preferences';

@Injectable({
  providedIn: 'root'
})
export class BottomNavbarPreferencesService {
  public selectedItemIds = signal<string[]>(DEFAULT_BOTTOM_NAV_ITEMS);

  constructor() {
    this.loadPreferences();
  }

  public updateSelectedItems(itemIds: string[]): void {
    if (itemIds.length !== 4) {
      return;
    }
    this.selectedItemIds.set(itemIds);
    this.savePreferences();
  }

  private loadPreferences(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 4) {
          this.selectedItemIds.set(parsed);
        }
      } catch {
        this.savePreferences();
      }
    } else {
      this.savePreferences();
    }
  }

  private savePreferences(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.selectedItemIds()));
  }
}
