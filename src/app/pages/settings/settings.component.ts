import { Component } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { injectSettingsService } from '../../services/settings.service';

@Component({
  selector: 'settings',
  imports: [PageContainerComponent, SelectModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private _settingsService = injectSettingsService();

  public currentSettings = this._settingsService.currentSettings;
  public updateSetting = this._settingsService.updateSetting;
}
