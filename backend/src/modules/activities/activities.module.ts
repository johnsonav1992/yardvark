import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Activity } from "./models/activities.model";
import { ActivitiesController } from "./controllers/activities.controller";
import { ActivitiesService } from "./services/activities.service";
import { ActivitiesResolver } from "./resolvers/activities.resolver";

@Module({
	imports: [TypeOrmModule.forFeature([Activity])],
	exports: [TypeOrmModule],
	controllers: [ActivitiesController],
	providers: [ActivitiesService, ActivitiesResolver],
})
export class ActivitiesModule {}
