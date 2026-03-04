import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettingsController } from "./controllers/settings.controller";
import { Settings } from "./models/settings.model";
import { SettingsResolver } from "./resolvers/settings.resolver";
import { SettingsService } from "./services/settings.service";

@Module({
	imports: [TypeOrmModule.forFeature([Settings])],
	exports: [TypeOrmModule, SettingsService],
	controllers: [SettingsController],
	providers: [SettingsService, SettingsResolver],
})
export class SettingsModule {}
