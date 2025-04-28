import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { Equipment } from '../../../types/equipment.types';

@Component({
  selector: 'equipment-preview-card',
  imports: [CardModule],
  templateUrl: './equipment-preview-card.component.html',
  styleUrl: './equipment-preview-card.component.scss'
})
export class EquipmentPreviewCardComponent {
  public equipment = input.required<Equipment>();
}
