import { Component, inject } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { EquipmentService } from '../../services/equipment.service';

@Component({
  selector: 'equipment',
  imports: [PageContainerComponent],
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.scss'
})
export class EquipmentComponent {
  private _equipmentService = inject(EquipmentService);
}
