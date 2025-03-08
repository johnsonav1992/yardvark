import { Component, computed } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { httpResource } from '@angular/common/http';
import { beUrl, putReq } from '../../utils/httpUtils';
import { Settings } from '../../types/settings.types';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'settings',
  imports: [PageContainerComponent, DropdownModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  public settings = httpResource<Settings>(beUrl('settings'));

  public currentSettings = computed(() => this.settings.value());

  public updateSetting<
    TKey extends keyof Settings,
    TValue extends Settings[TKey]
  >(settingName: TKey, newValue: TValue): void {
    putReq(beUrl('settings'), {
      ...this.currentSettings(),
      [settingName]: newValue
    }).subscribe();
  }
}
