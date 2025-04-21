export type ApiEndpointRoutes =
  | SettingsRoutes
  | EntriesRoutes
  | ActivitiesRoutes
  | LawnSegmentsRoutes
  | ProductsRoutes
  | UsersRoutes;

type SettingsRoutes = 'settings';
type EntriesRoutes =
  | 'entries'
  | 'entries/single'
  | 'entries/single/by-date'
  | 'entries/single/most-recent'
  | 'entries/recover'
  | 'entries/search';
type ActivitiesRoutes = 'activities';
type LawnSegmentsRoutes = 'lawn-segments';
type ProductsRoutes = 'products';
type UsersRoutes = 'users';
