import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailController } from './controllers/email.controller';
import { EmailService } from './services/email.service';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService], // Export in case other modules want to use it
})
export class EmailModule {}
