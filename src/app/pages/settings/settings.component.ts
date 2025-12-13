import { Component, inject, linkedSignal, signal, viewChild } from '@angular/core';
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
import { LawnSegment } from '../../types/lawnSegments.types';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { LawnSegmentsTableComponent } from '../../components/settings/lawn-segments-table/lawn-segments-table.component';
import { LawnMapComponent } from '../../components/settings/lawn-map/lawn-map.component';
import { GlobalUiService } from '../../services/global-ui.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { UnsavedChanges } from '../../guards/unsaved-changes-guard';
import { GDD_TARGET_INTERVALS } from '../../constants/gdd.constants';

@Component({
  selector: 'settings',
  imports: [
    PageContainerComponent,
    SelectModule,
    FormsModule,
    InputNumber,
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    LawnSegmentsTableComponent,
    LawnMapComponent,
    ToggleSwitchModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements UnsavedChanges {
  private _settingsService = injectSettingsService();
  private _locationService = inject(LocationService);
  private _lawnSegmentsService = inject(LawnSegmentsService);
  private _globalUiService = inject(GlobalUiService);

  private _lawnMapComponent = viewChild(LawnMapComponent);
  private _lawnSegmentsTableComponent = viewChild(LawnSegmentsTableComponent);

  public isMobile = this._globalUiService.isMobile;
  public currentSettings = this._settingsService.currentSettings;
  public settingsAreLoading = this._settingsService.settings.isLoading;
  public lawnSegments = this._lawnSegmentsService.lawnSegments;
  public updateSetting = this._settingsService.updateSetting;

  public lawnSize = linkedSignal(() => this.currentSettings()?.lawnSize);
  public hasUnsavedChanges = signal(false);
  public locationSearchText = signal<string>('');
  public debouncedSearchText = debouncedSignal(this.locationSearchText, 700);
  public segmentToFocusOnMap = signal<LawnSegment | null>(null);

  public foundLocations = rxResource({
    params: () =>
      this.debouncedSearchText()
        ? { query: this.debouncedSearchText() }
        : undefined,
    stream: ({ params }) =>
      this._locationService.searchForLocation(params?.query || '')
  });

  private _debouncedLawnSizeSetter = debounce(
    (newVal: number) => this.updateSetting('lawnSize', newVal),
    1500
  );

  private _debouncedGddTargetSetter = debounce(
    (newVal: number | undefined) => this.updateSetting('customGddTarget', newVal),
    1500
  );

  public setLawnSize(newVal: number): void {
    this._debouncedLawnSizeSetter(newVal);
  }

  public searchLocations(e: AutoCompleteCompleteEvent): void {
    this.locationSearchText.set(e.query);
  }

  public updateLocationSetting(e: AutoCompleteSelectEvent): void {
    const locationFeature = e.value as Feature;
    this.updateSetting('location', {
      lat: locationFeature.geometry.coordinates[1],
      long: locationFeature.geometry.coordinates[0],
      address: locationFeature.properties.full_address
    });
  }

  public onEditOnMap(segment: LawnSegment): void {
    this.segmentToFocusOnMap.set(segment);
    document.querySelector('lawn-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  public onSegmentSave(segment: LawnSegment): void {
    const mapEdits = this._lawnMapComponent()?.saveCurrentEdit();
    if (mapEdits) {
      segment.coordinates = [mapEdits.coordinates];
      segment.size = mapEdits.size;
      segment.color = mapEdits.color;
    }
  }

  public onMapEditingCanceled(segment: LawnSegment): void {
    this._lawnSegmentsTableComponent()?.cancelRowEdit(segment, false);
  }

  public onSegmentEditCanceled(): void {
    this._lawnMapComponent()?.cancelEditing(false);
  }

  public getDefaultGddTarget(): number {
    const grassType = this.currentSettings()?.grassType ?? 'cool';
    return GDD_TARGET_INTERVALS[grassType];
  }

  public setCustomGddTarget(value: number | null): void {
    this._debouncedGddTargetSetter(value ?? undefined);
  }

  public clearCustomGddTarget(): void {
    this.updateSetting('customGddTarget', undefined);
  }
}
