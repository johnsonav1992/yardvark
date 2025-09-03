import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { GroqService } from './services/groq.service';
import { GeminiService } from './services/gemini.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, GroqService, GeminiService],
  exports: [AiService, GroqService, GeminiService],
})
export class AiModule {}
