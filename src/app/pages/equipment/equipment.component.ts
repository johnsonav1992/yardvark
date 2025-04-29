import { Component, inject } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentPreviewCardComponent } from '../../components/equipment/equipment-preview-card/equipment-preview-card.component';
import { CardModule } from 'primeng/card';
import { LoadingSpinnerComponent } from '../../components/miscellanious/loading-spinner/loading-spinner.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'equipment',
  imports: [
    PageContainerComponent,
    EquipmentPreviewCardComponent,
    CardModule,
    LoadingSpinnerComponent,
    ButtonModule
  ],
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.scss'
})
export class EquipmentComponent {
  private _equipmentService = inject(EquipmentService);

  public equipment = this._equipmentService.equipment;
}
