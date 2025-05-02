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

@Component({
  selector: 'equipment-view',
  imports: [
    PageContainerComponent,
    LoadingSpinnerComponent,
    DividerModule,
    TitleCasePipe,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './equipment-view.component.html',
  styleUrl: './equipment-view.component.scss'
})
export class EquipmentViewComponent {
  private _globalUiService = inject(GlobalUiService);
  private _equipmentService = inject(EquipmentService);
  private _route = inject(ActivatedRoute);

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

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: '0'
    }
  };
}
