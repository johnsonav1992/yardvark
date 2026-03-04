export type ApiEndpointRoutes =
	| SettingsRoutes
	| EntriesRoutes
	| ActivitiesRoutes
	| LawnSegmentsRoutes
	| ProductsRoutes
	| UsersRoutes
	| EquipmentRoutes
	| AnalyticsRoutes
	| FileRoutes
	| WeatherRoutes
	| AiRoutes
	| EmailRoutes
	| GddRoutes
	| SubscriptionRoutes
	| SoilDataRoutes;

type SettingsRoutes = "settings";

type EntriesRoutes =
	| "entries"
	| "entries/batch"
	| "entries/single"
	| "entries/single/by-date"
	| "entries/single/most-recent"
	| "entries/recover"
	| "entries/search"
	| "entries/last-mow"
	| "entries/last-product-app"
	| "entries/entry-image";

type ActivitiesRoutes = "activities";

type LawnSegmentsRoutes = "lawn-segments";

type ProductsRoutes = "products" | "products/hide" | "products/unhide";

type UsersRoutes = "users" | "users/profile-picture";

type EquipmentRoutes =
	| "equipment"
	| `equipment/${number}`
	| `equipment/${number}/maintenance`
	| "equipment/maintenance"
	| `equipment/maintenance/${number}`;

type AnalyticsRoutes = "analytics";

type FileRoutes = "files/upload" | "files/download";

type WeatherRoutes = "weather/forecast";

type AiRoutes =
	| "ai/chat"
	| "ai/query-entries/stream"
	| "ai/query-entries/limit";

type EmailRoutes = "email/feedback";

type GddRoutes = "gdd/current" | "gdd/historical" | "gdd/forecast";

type SubscriptionRoutes =
	| "subscription/status"
	| "subscription/pricing"
	| "subscription/checkout"
	| "subscription/portal"
	| "subscription/check-feature";

type SoilDataRoutes = "soil-data" | "soil-data/rolling-week";
