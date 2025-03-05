import { Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { ProfileComponent } from './views/profile/profile.component';
import { SoilDetailsComponent } from './views/soil-details/soil-details.component';
import { EntryLogComponent } from './views/entry-log/entry-log.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'entry-log',
    component: EntryLogComponent,
  },
  {
    path: 'soil-data',
    component: SoilDetailsComponent,
  },
];
