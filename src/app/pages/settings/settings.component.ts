import {
  Component,
  inject,
  linkedSignal,
  signal,
  viewChild
} from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { injectSettingsService } from '../../services/settings.service';
import { InputNumber } from 'primeng/inputnumber';
import { debounce } from '../../utils/timeUtils';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent
} from 'primeng/autocomplete';
import { Feature } from '../../types/location.types';
import { LocationService } from '../../services/location.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { debouncedSignal } from '../../utils/signalUtils';
import { LawnSegmentsService } from '../../services/lawn-segments.service';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DataTableDesignTokens } from '@primeng/themes/types/datatable';
import { InputTextModule } from 'primeng/inputtext';
import { LawnSegment } from '../../types/lawnSegments.types';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'settings',
  imports: [
    PageContainerComponent,
    SelectModule,
    FormsModule,
    InputNumber,
    AutoCompleteModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private _settingsService = injectSettingsService();
  private _locationService = inject(LocationService);
  private _lawnSegmentsService = inject(LawnSegmentsService);

  public currentSettings = this._settingsService.currentSettings;
  public settingsAreLoading = this._settingsService.settings.isLoading;
  public lawnSegments = this._lawnSegmentsService.lawnSegments;

  public lawnSize = linkedSignal(() => this.currentSettings()?.lawnSize);
  public currentlyEditingLawnSegmentId = signal<number | null>(null);

  public locationSearchText = signal<string>('');
  public debouncedSearchText = debouncedSignal(this.locationSearchText, 700);

  public lawnSegmentTable = viewChild(Table);

  public foundLocations = rxResource({
    request: () =>
      this.debouncedSearchText()
        ? { query: this.debouncedSearchText() }
        : undefined,
    loader: ({ request }) =>
      this._locationService.searchForLocation(request?.query || '')
  });

  public updateSetting = this._settingsService.updateSetting;

  public setLawnSize(newVal: number): void {
    this.debouncedLawnSizeSetter(newVal);
  }

  public searchLocations(e: AutoCompleteCompleteEvent): void {
    this.locationSearchText.set(e.query);
  }

  public updateLocationSetting(e: AutoCompleteSelectEvent): void {
    const locationFeature = e.value as Feature;
    const lat = locationFeature.geometry.coordinates[1];
    const long = locationFeature.geometry.coordinates[0];

    this.updateSetting('location', {
      lat,
      long,
      address: locationFeature.properties.full_address
    });
  }

  public editLawnSegment(segment: LawnSegment): void {
    this.currentlyEditingLawnSegmentId.set(segment.id);
  }

  public addLawnSegmentRow(): void {
    const newId = Math.random();
    const newRow = { id: newId, name: '', area: 0, userId: '', size: 0 };

    this.lawnSegments.update((prev) => {
      return [...prev!, newRow];
    });

    this.currentlyEditingLawnSegmentId.set(newId);
    this.lawnSegmentTable()?.initRowEdit(newRow);
  }

  public log(e: any) {
    console.log(e);
  }

  private debouncedLawnSizeSetter = debounce(
    (newVal: number) => this.updateSetting('lawnSize', newVal),
    1500
  );

  public lawnSegsTableDt: DataTableDesignTokens = {
    bodyCell: { padding: '.25rem' },
    headerCell: { padding: '.25rem' }
  };
}
