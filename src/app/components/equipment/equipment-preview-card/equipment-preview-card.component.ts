import { Component, inject, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { Equipment } from '../../../types/equipment.types';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TooltipOptions } from 'primeng/api';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { EquipmentMaintenanceAddEditModalComponent } from '../equipment-maintenance-add-edit-modal/equipment-maintenance-add-edit-modal.component';
import { GlobalUiService } from '../../../services/global-ui.service';
import { EquipmentService } from '../../../services/equipment.service';

@Component({
  selector: 'equipment-preview-card',
  imports: [CardModule, DatePipe, ButtonModule, TooltipModule],
  templateUrl: './equipment-preview-card.component.html',
  styleUrl: './equipment-preview-card.component.scss',
  providers: [DialogService]
})
export class EquipmentPreviewCardComponent {
  private _router = inject(Router);
  private _dialogService = inject(DialogService);
  private _equipmentService = inject(EquipmentService);
  public isMobile = inject(GlobalUiService).isMobile;

  public equipment = input.required<Equipment>();

  public tooltipOptions: TooltipOptions = {
    appendTo: 'body',
    positionStyle: 'absolute'
  };

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

    if (this.isMobile()) this._dialogService.getInstance(dialogRef).maximize();

    dialogRef.onClose.subscribe((result) => {
      if (result === 'success') {
        this._equipmentService.equipment.reload();
      }
    });
  }
}
