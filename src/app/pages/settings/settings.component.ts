import { Component, linkedSignal } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { injectSettingsService } from '../../services/settings.service';
import { InputNumber } from 'primeng/inputnumber';
import { debounce } from '../../utils/timeUtils';

@Component({
  selector: 'settings',
  imports: [PageContainerComponent, SelectModule, FormsModule, InputNumber],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private _settingsService = injectSettingsService();

  public currentSettings = this._settingsService.currentSettings;
  public settingsAreLoading = this._settingsService.settings.isLoading;

  public lawnSize = linkedSignal(() => this.currentSettings()?.lawnSize);

  public updateSetting = this._settingsService.updateSetting;

  public setLawnSize(newVal: number): void {
    this.debouncedLawnSizeSetter(newVal);
  }

  private debouncedLawnSizeSetter = debounce(
    (newVal: number) => this.updateSetting('lawnSize', newVal),
    1500
  );
}
