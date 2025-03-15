export type ApiEndpointRoutes =
  | SettingsRoutes
  | EntriesRoutes
  | ActivitiesRoutes
  | LawnSegmentsRoutes;

type SettingsRoutes = 'settings';
type EntriesRoutes = 'entries' | 'entries/single';
type ActivitiesRoutes = 'activities';
type LawnSegmentsRoutes = 'lawn-segments';
