import { DatePipe } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import type { ButtonDesignTokens } from "@primeuix/themes/types/button";
import { differenceInDays, differenceInMonths, parseISO } from "date-fns";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogService } from "primeng/dynamicdialog";
import { FloatLabelModule } from "primeng/floatlabel";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { EquipmentMaintenanceAddEditModalComponent } from "../../components/equipment/equipment-maintenance-add-edit-modal/equipment-maintenance-add-edit-modal.component";
import { EquipmentPreviewCardComponent } from "../../components/equipment/equipment-preview-card/equipment-preview-card.component";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";
import { NO_IMAGE_URL } from "../../constants/style-constants";
import { EquipmentService } from "../../services/equipment.service";
import { GlobalUiService } from "../../services/global-ui.service";
import type { Equipment } from "../../types/equipment.types";

@Component({
	selector: "equipment",
	imports: [
		PageContainerComponent,
		EquipmentPreviewCardComponent,
		CardModule,
		SkeletonModule,
		ButtonModule,
		TooltipModule,
		FloatLabelModule,
		IconFieldModule,
		InputTextModule,
		InputIconModule,
		FormsModule,
		TableModule,
		TagModule,
		DatePipe,
	],
	templateUrl: "./equipment.component.html",
	styleUrl: "./equipment.component.scss",
	providers: [DialogService],
})
export class EquipmentComponent {
	private _equipmentService = inject(EquipmentService);
	private _globalUiService = inject(GlobalUiService);
	private _router = inject(Router);
	private _dialogService = inject(DialogService);

	public screenWidth = this._globalUiService.screenWidth;
	public isMobile = this._globalUiService.isMobile;

	public equipment = this._equipmentService.equipment;
	public noImageUrl = NO_IMAGE_URL;
	public skeletonCards = Array(6).fill(0);

	public viewMode = signal<"grid" | "table">("grid");

	public searchQuery = signal("");
	public filteredEquipment = computed(() =>
		this._equipmentService.equipment
			.value()
			?.filter(
				(item) =>
					item.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
					item.description
						?.toLowerCase()
						.includes(this.searchQuery().toLowerCase()) ||
					item.brand
						?.toLowerCase()
						.includes(this.searchQuery().toLowerCase()) ||
					item.model?.toLowerCase().includes(this.searchQuery().toLowerCase()),
			),
	);

	public toggleViewMode(): void {
		this.viewMode.set(this.viewMode() === "grid" ? "table" : "grid");
	}

	public navToAddEquipment(): void {
		this._router.navigate(["equipment", "add"]);
	}

	public goToEquipment(id: number): void {
		this._router.navigate(["equipment", id]);
	}

	public openMaintenanceRecordModal(e: Event, equipmentId: number): void {
		e.stopPropagation();

		const dialogRef = this._dialogService.open(
			EquipmentMaintenanceAddEditModalComponent,
			{
				header: "Add Maintenance Record",
				modal: true,
				focusOnShow: false,
				width: "50%",
				dismissableMask: true,
				closable: true,
				contentStyle: { overflow: "visible" },
				breakpoints: {
					"800px": "95%",
				},
				maximizable: true,
				inputValues: { equipmentId },
			},
		);

		if (dialogRef && this.isMobile()) {
			const instance = this._dialogService.getInstance(dialogRef);

			if (instance) instance.maximize();
		}

		dialogRef?.onClose.subscribe((result) => {
			if (result === "success") {
				this._equipmentService.equipment.reload();
			}
		});
	}

	public getMaintenanceStatusConfig(equipment: Equipment) {
		const records = equipment.maintenanceRecords;
		const now = new Date();
		const createdAt = parseISO(equipment.createdAt.toString());
		const daysSinceCreation = differenceInDays(now, createdAt);

		if (daysSinceCreation <= 2) {
			return {
				label: "Newly Added",
				severity: "info" as const,
				icon: "ti ti-sparkles",
			};
		}

		if (!records || records.length === 0) {
			const monthsSinceCreation = differenceInMonths(now, createdAt);

			if (monthsSinceCreation >= 1) {
				return {
					label: "Never Serviced",
					severity: "info" as const,
					icon: "ti ti-help-circle",
				};
			}

			return null;
		}

		const lastMaintenance = parseISO(records[0].maintenanceDate.toString());
		const monthsSince = differenceInMonths(now, lastMaintenance);

		if (monthsSince <= 1) {
			return {
				label: "Recently Serviced",
				severity: "success" as const,
				icon: "ti ti-circle-check",
			};
		}

		if (monthsSince >= 3 && monthsSince < 6) {
			return {
				label: "Service Soon",
				severity: "warn" as const,
				icon: "ti ti-clock-exclamation",
			};
		}

		if (monthsSince >= 6) {
			return {
				label: "Maintenance Due",
				severity: "danger" as const,
				icon: "ti ti-alert-triangle",
			};
		}

		return null;
	}

	public addButtonDt: ButtonDesignTokens = {
		root: {
			iconOnlyWidth: this.isMobile() ? "4rem" : "5rem",
			lg: {
				fontSize: "36px",
				iconOnlyWidth: this.isMobile() ? "4rem" : "5rem",
			},
		},
	};
}
