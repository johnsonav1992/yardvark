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
import { ProductViewComponent } from './pages/products/product-view/product-view.component';
import { EquipmentViewComponent } from './pages/equipment/equipment-view/equipment-view.component';
import { AddEditEquipmentComponent } from './pages/equipment/add-edit-equipment/add-edit-equipment.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { unsavedChangesGuard } from './guards/unsaved-changes-guard';

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
    component: ProductViewComponent,
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
    canActivate: [authGuard],
    pathMatch: 'full'
  },
  {
    path: 'equipment/add',
    component: AddEditEquipmentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'equipment/edit/:equipmentId',
    component: AddEditEquipmentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'equipment/:equipmentId',
    component: EquipmentViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard]
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [authGuard]
  }
];
