import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { S3Service } from "src/modules/s3/s3.service";
import { SubscriptionModule } from "../subscription/subscription.module";
import { EntriesController } from "./controllers/entries.controller";
import { Entry, EntryImage, EntryProduct } from "./models/entries.model";
import { EntriesResolver } from "./resolvers/entries.resolver";
import { EntriesService } from "./services/entries.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Entry, EntryProduct, EntryImage]),
		HttpModule,
		SubscriptionModule,
	],
	exports: [TypeOrmModule, EntriesService],
	controllers: [EntriesController],
	providers: [EntriesService, EntriesResolver, S3Service, ConfigService],
})
export class EntriesModule {}
