import { Component, computed, inject, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { Equipment } from '../../../types/equipment.types';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipOptions } from 'primeng/api';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { EquipmentMaintenanceAddEditModalComponent } from '../equipment-maintenance-add-edit-modal/equipment-maintenance-add-edit-modal.component';
import { GlobalUiService } from '../../../services/global-ui.service';
import { EquipmentService } from '../../../services/equipment.service';
import { NO_IMAGE_URL } from '../../../constants/style-constants';
import { differenceInDays, differenceInMonths } from 'date-fns';

@Component({
  selector: 'equipment-preview-card',
  imports: [CardModule, DatePipe, ButtonModule, TooltipModule, TagModule, DividerModule],
  templateUrl: './equipment-preview-card.component.html',
  styleUrl: './equipment-preview-card.component.scss',
  providers: [DialogService]
})
export class EquipmentPreviewCardComponent {
  private _router = inject(Router);
  private _dialogService = inject(DialogService);
  private _equipmentService = inject(EquipmentService);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;
  public screenWidth = this._globalUiService.screenWidth;

  public noImageUrl = NO_IMAGE_URL;

  public equipment = input.required<Equipment>();

  public tooltipOptions: TooltipOptions = {
    appendTo: 'body',
    positionStyle: 'absolute'
  };

  public maintenanceStatus = computed(() => {
    const equipmentData = this.equipment();
    const records = equipmentData.maintenanceRecords;
    const createdAt = new Date(equipmentData.createdAt);
    const now = new Date();
    const daysSinceCreation = differenceInDays(now, createdAt);

    if (daysSinceCreation <= 2) return 'new';

    if (!records || records.length === 0) {
      const monthsSinceCreation = differenceInMonths(now, createdAt);

      if (monthsSinceCreation >= 1) return 'never';

      return 'none';
    }

    const lastMaintenance = new Date(records[0].maintenanceDate);
    const monthsSince = differenceInMonths(now, lastMaintenance);

    if (monthsSince <= 1) return 'recent';

    if (monthsSince >= 3 && monthsSince < 6) return 'warning';

    if (monthsSince >= 6) return 'due';

    return 'none';
  });

  public maintenanceStatusConfig = computed(() => {
    const status = this.maintenanceStatus();

    switch (status) {
      case 'new':
        return {
          label: 'Newly Added',
          severity: 'info' as const,
          icon: 'ti ti-sparkles'
        };
      case 'recent':
        return {
          label: 'Recently Serviced',
          severity: 'success' as const,
          icon: 'ti ti-circle-check'
        };
      case 'warning':
        return {
          label: 'Service Soon',
          severity: 'warn' as const,
          icon: 'ti ti-clock-exclamation'
        };
      case 'due':
        return {
          label: 'Maintenance Due',
          severity: 'danger' as const,
          icon: 'ti ti-alert-triangle'
        };
      case 'never':
        return {
          label: 'Never Serviced',
          severity: 'info' as const,
          icon: 'ti ti-help-circle'
        };
      default:
        return null;
    }
  });

  public goToEquipment(): void {
    this._router.navigate(['equipment', this.equipment().id]);
  }

  public openMaintenanceRecordModal(e: Event, equipmentId: number): void {
    e.stopPropagation();

    const dialogRef = this._dialogService.open(
      EquipmentMaintenanceAddEditModalComponent,
      {
        header: 'Add Maintenance Record',
        modal: true,
        focusOnShow: false,
        width: '50%',
        dismissableMask: true,
        closable: true,
        contentStyle: { overflow: 'visible' },
        breakpoints: {
          '800px': '95%'
        },
        maximizable: true,
        inputValues: { equipmentId }
      }
    );

    if (dialogRef && this.isMobile()) {
      const instance = this._dialogService.getInstance(dialogRef);
      if (instance) instance.maximize();
    }

    dialogRef?.onClose.subscribe((result) => {
      if (result === 'success') {
        this._equipmentService.equipment.reload();
      }
    });
  }
}
