import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LawnSegmentsController } from "./controllers/lawn-segments.controller";
import { LawnSegment } from "./models/lawn-segments.model";
import { LawnSegmentsResolver } from "./resolvers/lawn-segments.resolver";
import { LawnSegmentsService } from "./services/lawn-segments.service";

@Module({
	imports: [TypeOrmModule.forFeature([LawnSegment])],
	exports: [TypeOrmModule, LawnSegmentsService],
	controllers: [LawnSegmentsController],
	providers: [LawnSegmentsService, LawnSegmentsResolver],
})
export class LawnSegmentsModule {}
