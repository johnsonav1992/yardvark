import { Component } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { httpResource } from '@angular/common/http';
import { beUrl, putReq } from '../../utils/httpUtils';

@Component({
  selector: 'settings',
  imports: [PageContainerComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  public settings = httpResource(beUrl('settings'));

  public updateSetting(settingName: string, newValue: string): void {
    putReq(beUrl('settings'), { temperatureUnit: 'celcius' });
  }
}
