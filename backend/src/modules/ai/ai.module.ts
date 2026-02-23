import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiController } from "./controllers/ai.controller";
import { AiService } from "./services/ai.service";
import { GeminiService } from "./services/gemini.service";

@Module({
	imports: [ConfigModule],
	controllers: [AiController],
	providers: [AiService, GeminiService],
	exports: [AiService, GeminiService],
})
export class AiModule {}
