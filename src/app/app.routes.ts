import { Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { ProfileComponent } from './views/profile/profile.component';
import { SoilDataComponent } from './views/soil-data/soil-data.component';
import { EntryLogComponent } from './views/entry-log/entry-log.component';
import { SettingsComponent } from './views/settings/settings.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'entry-log',
    component: EntryLogComponent
  },
  {
    path: 'soil-data',
    component: SoilDataComponent
  },
  {
    path: 'settings',
    component: SettingsComponent
  }
];
