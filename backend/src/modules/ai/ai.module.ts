import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntriesModule } from "../entries/entries.module";
import { Entry } from "../entries/models/entries.model";
import { AiController } from "./controllers/ai.controller";
import { AiService } from "./services/ai.service";
import { EmbeddingService } from "./services/embedding.service";
import { GeminiService } from "./services/gemini.service";

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([Entry]),
		forwardRef(() => EntriesModule),
	],
	controllers: [AiController],
	providers: [AiService, GeminiService, EmbeddingService],
	exports: [AiService, GeminiService, EmbeddingService],
})
export class AiModule {}
