export type ApiEndpointRoutes =
  | SettingsRoutes
  | EntriesRoutes
  | ActivitiesRoutes;

type SettingsRoutes = 'settings';
type EntriesRoutes = 'entries' | 'entries/single';
type ActivitiesRoutes = 'activities';
