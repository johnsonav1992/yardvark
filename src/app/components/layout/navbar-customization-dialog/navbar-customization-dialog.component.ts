import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { SettingsService } from '../../../services/settings.service';

interface SelectableNavItem {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
}

const DEFAULT_NAV_ITEMS = ['dashboard', 'entry-log', 'products', 'analytics'];

@Component({
  selector: 'navbar-customization-dialog',
  imports: [CommonModule, ButtonModule, ToggleButtonModule, FormsModule],
  templateUrl: './navbar-customization-dialog.component.html',
  styleUrl: './navbar-customization-dialog.component.scss'
})
export class NavbarCustomizationDialogComponent {
  private _dialogRef = inject(DynamicDialogRef);
  private _settingsService = inject(SettingsService);

  public items = signal<SelectableNavItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'ti ti-dashboard',
      selected: false
    },
    {
      id: 'entry-log',
      label: 'Entry Log',
      icon: 'ti ti-calendar',
      selected: false
    },
    {
      id: 'soil-data',
      label: 'Soil data',
      icon: 'ti ti-shovel',
      selected: false
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'ti ti-packages',
      selected: false
    },
    {
      id: 'equipment',
      label: 'Equipment',
      icon: 'ti ti-assembly',
      selected: false
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'ti ti-chart-dots',
      selected: false
    },
    {
      id: 'calculators',
      label: 'Calculators',
      icon: 'ti ti-calculator',
      selected: false
    }
  ]);

  public selectedCount = computed(
    () => this.items().filter((item) => item.selected).length
  );

  constructor() {
    const settings = this._settingsService.currentSettings();
    const currentSelection = settings?.mobileNavbarItems?.length === 4
      ? settings.mobileNavbarItems
      : DEFAULT_NAV_ITEMS;

    this.items.update((items) =>
      items.map((item) => ({
        ...item,
        selected: currentSelection.includes(item.id)
      }))
    );
  }

  public canToggleItem(item: SelectableNavItem): boolean {
    if (item.selected) return true;

    return this.selectedCount() < 4;
  }

  public toggleItem(itemId: string): void {
    this.items.update((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  }

  public save(): void {
    const selectedIds = this.items()
      .filter((item) => item.selected)
      .map((item) => item.id);

    if (selectedIds.length === 4) {
      this._settingsService.updateSetting('mobileNavbarItems', selectedIds);
      this._dialogRef.close(true);
    }
  }

  public cancel(): void {
    this._dialogRef.close(false);
  }
}
