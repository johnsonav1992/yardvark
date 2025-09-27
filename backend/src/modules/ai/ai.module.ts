import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { GroqService } from './services/groq.service';
import { GeminiService } from './services/gemini.service';
import { EmbeddingService } from './services/embedding.service';
import { Entry } from '../entries/models/entries.model';
import { EntriesModule } from '../entries/entries.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Entry]),
    forwardRef(() => EntriesModule),
  ],
  controllers: [AiController],
  providers: [AiService, GroqService, GeminiService, EmbeddingService],
  exports: [AiService, GroqService, GeminiService, EmbeddingService],
})
export class AiModule {}
