import { Module } from "@nestjs/common";
import { EntriesModule } from "../entries/entries.module";
import { DashboardController } from "./controllers/dashboard.controller";
import { DashboardService } from "./services/dashboard.service";

@Module({
	imports: [EntriesModule],
	controllers: [DashboardController],
	providers: [DashboardService],
})
export class DashboardModule {}
