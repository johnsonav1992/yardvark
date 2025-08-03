import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { GroqService } from './services/groq.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, GroqService],
  exports: [AiService, GroqService],
})
export class AiModule {}
