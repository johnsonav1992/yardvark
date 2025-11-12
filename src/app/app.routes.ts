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
import { authGuardFn } from '@auth0/auth0-angular';
import { ProductViewComponent } from './pages/products/product-view/product-view.component';
import { EquipmentViewComponent } from './pages/equipment/equipment-view/equipment-view.component';
import { AddEditEquipmentComponent } from './pages/equipment/add-edit-equipment/add-edit-equipment.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { unsavedChangesGuard } from './guards/unsaved-changes-guard';
import { CalculatorsPage } from './pages/calculators/calculators-page';
import { AddEntryComponent } from './pages/entry-log/add-entry/add-entry.component';

export const mainRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
    // canActivate: [authGuardFn]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'entry-log',
    component: EntryLogComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'entry-log/add',
    component: AddEntryComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'entry-log/:entryId',
    component: EntryViewComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'soil-data',
    component: SoilDataComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'products/add',
    component: AddProductComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'products/:productId',
    component: ProductViewComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'equipment',
    component: EquipmentComponent,
    canActivate: [authGuardFn],
    pathMatch: 'full'
  },
  {
    path: 'equipment/add',
    component: AddEditEquipmentComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'equipment/edit/:equipmentId',
    component: AddEditEquipmentComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'equipment/:equipmentId',
    component: EquipmentViewComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuardFn],
    canDeactivate: [unsavedChangesGuard]
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [authGuardFn]
  },
  {
    path: 'calculators',
    component: CalculatorsPage,
    canActivate: [authGuardFn]
  }
];
