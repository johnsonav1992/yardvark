import { Component, inject, model } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ActivitiesService } from '../../../../services/activities.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { LawnSegmentsService } from '../../../../services/lawn-segments.service';
import { ProductsService } from '../../../../services/products.service';
import { GlobalUiService } from '../../../../services/global-ui.service';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'entry-search-sidebar',
  imports: [
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DrawerModule,
    DividerModule,
    MultiSelectModule,
    FloatLabelModule,
    DatePickerModule
  ],
  templateUrl: './entry-search-sidebar.component.html',
  styleUrl: './entry-search-sidebar.component.scss'
})
export class EntrySearchSidebarComponent {
  private _activitiesService = inject(ActivitiesService);
  private _lawnSegmentsService = inject(LawnSegmentsService);
  private _productsService = inject(ProductsService);
  private _globalUiService = inject(GlobalUiService);

  public isOpen = model(false);

  public activities = this._activitiesService.activities;
  public lawnSegments = this._lawnSegmentsService.lawnSegments;
  public products = this._productsService.products;

  public isMobile = this._globalUiService.isMobile;
}
