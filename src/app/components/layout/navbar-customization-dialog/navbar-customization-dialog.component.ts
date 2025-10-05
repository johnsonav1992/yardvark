import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { BottomNavbarPreferencesService } from '../../../services/bottom-navbar-preferences.service';

interface SelectableNavItem {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'navbar-customization-dialog',
  imports: [CommonModule, ButtonModule, ToggleButtonModule, FormsModule],
  templateUrl: './navbar-customization-dialog.component.html',
  styleUrl: './navbar-customization-dialog.component.scss'
})
export class NavbarCustomizationDialogComponent {
  private _dialogRef = inject(DynamicDialogRef);
  private _preferencesService = inject(BottomNavbarPreferencesService);

  public items = signal<SelectableNavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: 'ti ti-dashboard', selected: false },
    { id: 'entry-log', label: 'Entry Log', icon: 'ti ti-calendar', selected: false },
    { id: 'soil-data', label: 'Soil data', icon: 'ti ti-shovel', selected: false },
    { id: 'products', label: 'Products', icon: 'ti ti-packages', selected: false },
    { id: 'equipment', label: 'Equipment', icon: 'ti ti-assembly', selected: false },
    { id: 'analytics', label: 'Analytics', icon: 'ti ti-chart-dots', selected: false },
    { id: 'calculators', label: 'Calculators', icon: 'ti ti-calculator', selected: false }
  ]);

  public selectedCount = computed(() => 
    this.items().filter(item => item.selected).length
  );

  constructor() {
    const currentSelection = this._preferencesService.selectedItemIds();
    this.items.update(items =>
      items.map(item => ({
        ...item,
        selected: currentSelection.includes(item.id)
      }))
    );
  }

  public canToggleItem(item: SelectableNavItem): boolean {
    return item.selected || this.selectedCount() < 4;
  }

  public toggleItem(itemId: string): void {
    const item = this.items().find(i => i.id === itemId);
    
    if (!item || !this.canToggleItem(item)) return;

    this.items.update(items =>
      items.map(i =>
        i.id === itemId ? { ...i, selected: !i.selected } : i
      )
    );
  }

  public save(): void {
    const selectedIds = this.items()
      .filter(item => item.selected)
      .map(item => item.id);

    if (selectedIds.length === 4) {
      this._preferencesService.updateSelectedItems(selectedIds);
      this._dialogRef.close(true);
    }
  }

  public cancel(): void {
    this._dialogRef.close(false);
  }
}
