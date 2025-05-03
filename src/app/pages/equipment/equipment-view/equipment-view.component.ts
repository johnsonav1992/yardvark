import { Component, computed, inject } from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { LoadingSpinnerComponent } from '../../../components/miscellanious/loading-spinner/loading-spinner.component';
import { DividerModule } from 'primeng/divider';
import { GlobalUiService } from '../../../services/global-ui.service';
import { EquipmentService } from '../../../services/equipment.service';
import { DividerDesignTokens } from '@primeng/themes/types/divider';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { CardDesignTokens } from '@primeng/themes/types/card';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { EquipmentMaintenanceAddEditModalComponent } from '../../../components/equipment/equipment-maintenance-add-edit-modal/equipment-maintenance-add-edit-modal.component';
import { EquipmentMaintenance } from '../../../types/equipment.types';

@Component({
  selector: 'equipment-view',
  imports: [
    PageContainerComponent,
    LoadingSpinnerComponent,
    DividerModule,
    TitleCasePipe,
    DatePipe,
    CurrencyPipe,
    TableModule,
    CardModule,
    ButtonModule
  ],
  templateUrl: './equipment-view.component.html',
  styleUrl: './equipment-view.component.scss',
  providers: [DialogService]
})
export class EquipmentViewComponent {
  private _globalUiService = inject(GlobalUiService);
  private _equipmentService = inject(EquipmentService);
  private _route = inject(ActivatedRoute);
  private _dialogService = inject(DialogService);

  public isMobile = this._globalUiService.isMobile;

  public equipmentId = toSignal(
    this._route.params.pipe(map((params) => parseInt(params['equipmentId'])))
  );

  public isLoading = computed(() =>
    this._equipmentService.equipment.isLoading()
  );

  public equipment = computed(() =>
    this._equipmentService.equipment
      .value()
      ?.find((equipment) => equipment.id === this.equipmentId())
  );

  public openEquipmentModal(maintenanceRecord?: EquipmentMaintenance): void {
    const dialogRef = this._dialogService.open(
      EquipmentMaintenanceAddEditModalComponent,
      {
        header: `${maintenanceRecord ? 'Edit' : 'Add'} Maintenance Record`,
        modal: true,
        focusOnShow: false,
        width: '50%',
        dismissableMask: true,
        closable: true,
        contentStyle: { overflow: 'visible' },
        inputValues: {
          date: maintenanceRecord?.maintenanceDate
            ? new Date(maintenanceRecord?.maintenanceDate)
            : undefined,
          notes: maintenanceRecord?.notes,
          cost: maintenanceRecord?.cost,
          equipmentId: this.equipmentId(),
          maintenanceId: maintenanceRecord?.id
        },
        breakpoints: {
          '800px': '95%'
        },
        maximizable: true
      }
    );

    if (this.isMobile()) this._dialogService.getInstance(dialogRef).maximize();

    dialogRef.onClose.subscribe((result) => {
      if (result === 'success') {
        this._equipmentService.equipment.reload();
      }
    });
  }

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: '0'
    }
  };

  public cardDt: CardDesignTokens = {
    root: { shadow: '0 0 2px rgba(0, 0, 0, 0.3)' },
    body: { padding: '1rem .75rem 1.5rem .75rem' }
  };
}
