import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { HttpModule } from "@nestjs/axios";
import { SoilDataController } from "./controllers/soil-data.controller";
import { SoilDataService } from "./services/soil-data.service";
import { SettingsModule } from "../settings/settings.module";
import { SOIL_DATA_CACHE_TTL } from "./models/soil-data.constants";

@Module({
	imports: [
		CacheModule.register({
			ttl: SOIL_DATA_CACHE_TTL,
			max: 1000,
		}),
		HttpModule,
		SettingsModule,
	],
	controllers: [SoilDataController],
	providers: [SoilDataService],
	exports: [SoilDataService],
})
export class SoilDataModule {}
