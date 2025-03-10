import { Module } from '@nestjs/common';
import { SettingsController } from './controller/settings.controller';
import { SettingsService } from './service/settings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './models/settings.model';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  exports: [TypeOrmModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
