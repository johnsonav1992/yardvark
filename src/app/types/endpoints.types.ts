export type ApiEndpointRoutes =
  | SettingsRoutes
  | EntriesRoutes
  | ActivitiesRoutes
  | LawnSegmentsRoutes
  | ProductsRoutes
  | UsersRoutes
  | EquipmentRoutes;

type SettingsRoutes = 'settings';
type EntriesRoutes =
  | 'entries'
  | 'entries/single'
  | 'entries/single/by-date'
  | 'entries/single/most-recent'
  | 'entries/recover'
  | 'entries/search'
  | 'entries/last-mow'
  | 'entries/last-product-app';
type ActivitiesRoutes = 'activities';
type LawnSegmentsRoutes = 'lawn-segments';
type ProductsRoutes = 'products' | 'products/hide' | 'products/unhide';
type UsersRoutes = 'users';
type EquipmentRoutes =
  | 'equipment'
  | `equipment/${number}`
  | `equipment/${number}/maintenance`
  | 'equipment/maintenance'
  | `equipment/maintenance/${number}`;
