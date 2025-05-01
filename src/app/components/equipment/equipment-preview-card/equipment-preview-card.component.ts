import { Component, inject, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { Equipment } from '../../../types/equipment.types';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TooltipOptions } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'equipment-preview-card',
  imports: [CardModule, DatePipe, ButtonModule, TooltipModule],
  templateUrl: './equipment-preview-card.component.html',
  styleUrl: './equipment-preview-card.component.scss'
})
export class EquipmentPreviewCardComponent {
  private _router = inject(Router);

  public equipment = input.required<Equipment>();

  public tooltipOptions: TooltipOptions = {
    appendTo: 'body',
    positionStyle: 'absolute'
  };

  public goToEquipment(): void {
    this._router.navigate(['equipment', this.equipment().id]);
  }
}
