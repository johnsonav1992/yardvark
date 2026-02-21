import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ToggleButtonModule } from "primeng/togglebutton";
import { FormsModule } from "@angular/forms";
import { DynamicDialogRef } from "primeng/dynamicdialog";
import { SettingsService } from "../../../services/settings.service";
import {
	NAV_ITEMS,
	DEFAULT_MOBILE_NAV_ITEMS,
} from "../../../config/navigation.config";

interface SelectableNavItem {
	id: string;
	label: string;
	icon: string;
	selected: boolean;
}

@Component({
	selector: "navbar-customization-dialog",
	imports: [CommonModule, ButtonModule, ToggleButtonModule, FormsModule],
	templateUrl: "./navbar-customization-dialog.component.html",
	styleUrl: "./navbar-customization-dialog.component.scss",
})
export class NavbarCustomizationDialogComponent {
	private _dialogRef = inject(DynamicDialogRef);
	private _settingsService = inject(SettingsService);

	public items = signal<SelectableNavItem[]>(
		NAV_ITEMS.map((item) => ({
			id: item.id,
			label: item.label,
			icon: item.icon,
			selected: false,
		})),
	);

	public selectedCount = computed(
		() => this.items().filter((item) => item.selected).length,
	);

	constructor() {
		const settings = this._settingsService.currentSettings();
		const items = settings?.mobileNavbarItems;
		const currentSelection =
			items && items.length >= 4 && items.length <= 5
				? items
				: DEFAULT_MOBILE_NAV_ITEMS;

		this.items.update((items) =>
			items.map((item) => ({
				...item,
				selected: currentSelection.includes(item.id),
			})),
		);
	}

	public canToggleItem(item: SelectableNavItem): boolean {
		if (item.selected) return true;

		return this.selectedCount() < 5;
	}

	public toggleItem(itemId: string): void {
		this.items.update((items) =>
			items.map((item) =>
				item.id === itemId ? { ...item, selected: !item.selected } : item,
			),
		);
	}

	public save(): void {
		const selectedIds = this.items()
			.filter((item) => item.selected)
			.map((item) => item.id);

		if (selectedIds.length >= 4 && selectedIds.length <= 5) {
			this._settingsService.updateSetting("mobileNavbarItems", selectedIds);
			this._dialogRef.close(true);
		}
	}

	public cancel(): void {
		this._dialogRef.close(false);
	}
}
