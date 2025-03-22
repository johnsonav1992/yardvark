export type ApiEndpointRoutes =
  | SettingsRoutes
  | EntriesRoutes
  | ActivitiesRoutes
  | LawnSegmentsRoutes
  | ProductsRoutes;

type SettingsRoutes = 'settings';
type EntriesRoutes =
  | 'entries'
  | 'entries/single'
  | 'entries/single/by-date'
  | 'entries/single/most-recent'
  | 'entries/recover';
type ActivitiesRoutes = 'activities';
type LawnSegmentsRoutes = 'lawn-segments';
type ProductsRoutes = 'products';
