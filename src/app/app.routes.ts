import type { Routes } from "@angular/router";
import { hybridAuthGuard } from "./guards/hybrid-auth.guard";
import { unsavedChangesGuard } from "./guards/unsaved-changes-guard";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";

export const mainRoutes: Routes = [
	{
		path: "",
		redirectTo: "dashboard",
		pathMatch: "full",
	},
	{
		path: "dashboard",
		component: DashboardComponent,
		canActivate: [hybridAuthGuard],
	},
	{
		path: "profile",
		loadComponent: () =>
			import("./pages/profile/profile.component").then(
				(m) => m.ProfileComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "entry-log",
		loadComponent: () =>
			import("./pages/entry-log/entry-log.component").then(
				(m) => m.EntryLogComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "entry-log/add",
		loadComponent: () =>
			import("./pages/entry-log/add-entry/add-entry.component").then(
				(m) => m.AddEntryComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "entry-log/:entryId",
		loadComponent: () =>
			import("./pages/entry-log/entry-view/entry-view.component").then(
				(m) => m.EntryViewComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "soil-data",
		loadComponent: () =>
			import("./pages/soil-data/soil-data.component").then(
				(m) => m.SoilDataComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "gdd-tracking",
		loadComponent: () =>
			import("./pages/gdd-data/gdd-data.component").then(
				(m) => m.GddDataComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "products/add",
		loadComponent: () =>
			import("./pages/products/add-product/add-product.component").then(
				(m) => m.AddProductComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "products/:productId",
		loadComponent: () =>
			import("./pages/products/product-view/product-view.component").then(
				(m) => m.ProductViewComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "products",
		loadComponent: () =>
			import("./pages/products/products.component").then(
				(m) => m.ProductsComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "equipment",
		loadComponent: () =>
			import("./pages/equipment/equipment.component").then(
				(m) => m.EquipmentComponent,
			),
		canActivate: [hybridAuthGuard],
		pathMatch: "full",
	},
	{
		path: "equipment/add",
		loadComponent: () =>
			import(
				"./pages/equipment/add-edit-equipment/add-edit-equipment.component"
			).then((m) => m.AddEditEquipmentComponent),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "equipment/edit/:equipmentId",
		loadComponent: () =>
			import(
				"./pages/equipment/add-edit-equipment/add-edit-equipment.component"
			).then((m) => m.AddEditEquipmentComponent),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "equipment/:equipmentId",
		loadComponent: () =>
			import(
				"./pages/equipment/equipment-view/equipment-view.component"
			).then((m) => m.EquipmentViewComponent),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "settings",
		loadComponent: () =>
			import("./pages/settings/settings.component").then(
				(m) => m.SettingsComponent,
			),
		canActivate: [hybridAuthGuard],
		canDeactivate: [unsavedChangesGuard],
	},
	{
		path: "analytics",
		loadComponent: () =>
			import("./pages/analytics/analytics.component").then(
				(m) => m.AnalyticsComponent,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "calculators",
		loadComponent: () =>
			import("./pages/calculators/calculators-page").then(
				(m) => m.CalculatorsPage,
			),
		canActivate: [hybridAuthGuard],
	},
	{
		path: "subscription",
		loadComponent: () =>
			import("./pages/subscription/subscription.component").then(
				(m) => m.SubscriptionComponent,
			),
		canActivate: [hybridAuthGuard],
	},
];
