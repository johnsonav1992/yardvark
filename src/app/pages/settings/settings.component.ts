import { Component, inject, linkedSignal, signal } from '@angular/core';
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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { LawnSegmentsTableComponent } from '../../components/settings/lawn-segments-table/lawn-segments-table.component';
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

  public isMobile = this._globalUiService.isMobile;
  public currentSettings = this._settingsService.currentSettings;
  public settingsAreLoading = this._settingsService.settings.isLoading;
  public lawnSegments = this._lawnSegmentsService.lawnSegments;

  public lawnSize = linkedSignal(() => this.currentSettings()?.lawnSize);

  public hasUnsavedChanges = signal(false);
  public locationSearchText = signal<string>('');
  public debouncedSearchText = debouncedSignal(this.locationSearchText, 700);

  public foundLocations = rxResource({
    params: () =>
      this.debouncedSearchText()
        ? { query: this.debouncedSearchText() }
        : undefined,
    stream: ({ params }) =>
      this._locationService.searchForLocation(params?.query || '')
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

  private debouncedLawnSizeSetter = debounce(
    (newVal: number) => this.updateSetting('lawnSize', newVal),
    1500
  );

  private debouncedGddTargetSetter = debounce(
    (newVal: number | undefined) =>
      this.updateSetting('customGddTarget', newVal),
    1500
  );

  public getDefaultGddTarget(): number {
    const grassType = this.currentSettings()?.grassType ?? 'cool';
    return GDD_TARGET_INTERVALS[grassType];
  }

  public setCustomGddTarget(value: number | null): void {
    this.debouncedGddTargetSetter(value ?? undefined);
  }

  public clearCustomGddTarget(): void {
    this.updateSetting('customGddTarget', undefined);
  }
}
