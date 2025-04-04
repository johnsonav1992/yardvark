import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SoilDataComponent } from './pages/soil-data/soil-data.component';
import { EntryLogComponent } from './pages/entry-log/entry-log.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProductsComponent } from './pages/products/products.component';
import { EquipmentComponent } from './pages/equipment/equipment.component';
import { EntryViewComponent } from './pages/entry-log/entry-view/entry-view.component';
import { AddProductComponent } from './pages/products/add-product/add-product.component';
import { authGuard } from './guards/auth.guard';

export const mainRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'entry-log',
    component: EntryLogComponent,
    canActivate: [authGuard]
  },
  {
    path: 'entry-log/:entryId',
    component: EntryViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'soil-data',
    component: SoilDataComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products/add',
    component: AddProductComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products/:productId',
    component: ProductsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'equipment',
    component: EquipmentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard]
  }
];
