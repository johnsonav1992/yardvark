import { Module } from '@nestjs/common';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import { SettingsResolver } from './resolvers/settings.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './models/settings.model';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  exports: [TypeOrmModule, SettingsService],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsResolver],
})
export class SettingsModule {}
