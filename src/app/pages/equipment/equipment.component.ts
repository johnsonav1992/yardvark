import { Component, computed, inject, signal } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentPreviewCardComponent } from '../../components/equipment/equipment-preview-card/equipment-preview-card.component';
import { CardModule } from 'primeng/card';
import { LoadingSpinnerComponent } from '../../components/miscellanious/loading-spinner/loading-spinner.component';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { GlobalUiService } from '../../services/global-ui.service';
import { ButtonDesignTokens } from '@primeng/themes/types/button';
import { Router } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'equipment',
  imports: [
    PageContainerComponent,
    EquipmentPreviewCardComponent,
    CardModule,
    LoadingSpinnerComponent,
    ButtonModule,
    ButtonModule,
    TooltipModule,
    FloatLabelModule,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    FormsModule
  ],
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.scss'
})
export class EquipmentComponent {
  private _equipmentService = inject(EquipmentService);
  private _globalUiService = inject(GlobalUiService);
  private _router = inject(Router);

  public isMobile = this._globalUiService.isMobile;

  public equipment = this._equipmentService.equipment;

  public searchQuery = signal('');
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
          item.model?.toLowerCase().includes(this.searchQuery().toLowerCase())
      )
  );

  public navToAddEquipment(): void {
    this._router.navigate(['equipment', 'add']);
  }

  public addButtonDt: ButtonDesignTokens = {
    root: {
      iconOnlyWidth: this.isMobile() ? '4rem' : '5rem',
      lg: {
        fontSize: '36px'
      }
    }
  };
}
