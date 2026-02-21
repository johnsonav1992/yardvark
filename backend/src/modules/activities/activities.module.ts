import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ActivitiesController } from "./controllers/activities.controller";
import { Activity } from "./models/activities.model";
import { ActivitiesResolver } from "./resolvers/activities.resolver";
import { ActivitiesService } from "./services/activities.service";

@Module({
	imports: [TypeOrmModule.forFeature([Activity])],
	exports: [TypeOrmModule],
	controllers: [ActivitiesController],
	providers: [ActivitiesService, ActivitiesResolver],
})
export class ActivitiesModule {}
