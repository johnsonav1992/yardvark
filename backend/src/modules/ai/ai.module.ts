import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Entry, EntryImage, EntryProduct } from "../entries/models/entries.model";
import { EntriesModule } from "../entries/entries.module";
import { LawnSegment } from "../lawn-segments/models/lawn-segments.model";
import { LawnSegmentsModule } from "../lawn-segments/lawn-segments.module";
import { Product } from "../products/models/products.model";
import { ProductsModule } from "../products/products.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { AiController } from "./controllers/ai.controller";
import { AiSessionService } from "./services/ai-session.service";
import { AiService } from "./services/ai.service";
import { EntryQueryToolsService } from "./services/entry-query-tools.service";
import { GeminiService } from "./services/gemini.service";

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([Entry, EntryProduct, EntryImage, Product, LawnSegment]),
		EntriesModule,
		ProductsModule,
		LawnSegmentsModule,
		SubscriptionModule,
	],
	controllers: [AiController],
	providers: [AiService, AiSessionService, GeminiService, EntryQueryToolsService],
	exports: [AiService, GeminiService],
})
export class AiModule {}
