import { Component } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { httpResource } from '@angular/common/http';
import { beUrl } from '../../utils/httpUtils';

@Component({
  selector: 'settings',
  imports: [PageContainerComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  public posts = httpResource(beUrl('settings'));
}
