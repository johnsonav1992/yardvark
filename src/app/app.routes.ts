import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SoilDataComponent } from './pages/soil-data/soil-data.component';
import { EntryLogComponent } from './pages/entry-log/entry-log.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProductsComponent } from './pages/products/products.component';
import { EquipmentComponent } from './pages/equipment/equipment.component';

export const productRoutes: Routes = [
  { path: ':productId', component: ProductsComponent }
];

export const mainRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
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
    path: 'products',
    component: ProductsComponent,
    children: productRoutes
  },
  {
    path: 'equipment',
    component: EquipmentComponent
  },
  {
    path: 'settings',
    component: SettingsComponent
  }
];
