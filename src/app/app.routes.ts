import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SoilDataComponent } from './pages/soil-data/soil-data.component';
import { GddDataComponent } from './pages/gdd-data/gdd-data.component';
import { EntryLogComponent } from './pages/entry-log/entry-log.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProductsComponent } from './pages/products/products.component';
import { EquipmentComponent } from './pages/equipment/equipment.component';
import { EntryViewComponent } from './pages/entry-log/entry-view/entry-view.component';
import { AddProductComponent } from './pages/products/add-product/add-product.component';
import { ProductViewComponent } from './pages/products/product-view/product-view.component';
import { EquipmentViewComponent } from './pages/equipment/equipment-view/equipment-view.component';
import { AddEditEquipmentComponent } from './pages/equipment/add-edit-equipment/add-edit-equipment.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { unsavedChangesGuard } from './guards/unsaved-changes-guard';
import { CalculatorsPage } from './pages/calculators/calculators-page';
import { AddEntryComponent } from './pages/entry-log/add-entry/add-entry.component';
import { hybridAuthGuard } from './guards/hybrid-auth.guard';

export const mainRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'entry-log',
    component: EntryLogComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'entry-log/add',
    component: AddEntryComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'entry-log/:entryId',
    component: EntryViewComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'soil-data',
    component: SoilDataComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'gdd-tracking',
    component: GddDataComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'products/add',
    component: AddProductComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'products/:productId',
    component: ProductViewComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'equipment',
    component: EquipmentComponent,
    canActivate: [hybridAuthGuard],
    pathMatch: 'full'
  },
  {
    path: 'equipment/add',
    component: AddEditEquipmentComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'equipment/edit/:equipmentId',
    component: AddEditEquipmentComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'equipment/:equipmentId',
    component: EquipmentViewComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [hybridAuthGuard],
    canDeactivate: [unsavedChangesGuard]
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [hybridAuthGuard]
  },
  {
    path: 'calculators',
    component: CalculatorsPage,
    canActivate: [hybridAuthGuard]
  }
];
