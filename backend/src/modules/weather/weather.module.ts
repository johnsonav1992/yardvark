import { HttpModule } from "@nestjs/axios";
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { WeatherController } from "./controllers/weather.controller";
import { WeatherService } from "./services/weather.service";

// Cache TTLs in milliseconds
const FORECAST_CACHE_TTL = 1000 * 60 * 60; // 1 hour for forecast data
const HISTORICAL_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours for historical data

@Module({
	imports: [
		HttpModule,
		CacheModule.register({
			ttl: FORECAST_CACHE_TTL,
			max: 500,
		}),
	],
	controllers: [WeatherController],
	providers: [
		WeatherService,
		{ provide: "FORECAST_CACHE_TTL", useValue: FORECAST_CACHE_TTL },
		{ provide: "HISTORICAL_CACHE_TTL", useValue: HISTORICAL_CACHE_TTL },
	],
	exports: [WeatherService],
})
export class WeatherModule {}
