import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GddController } from './controllers/gdd.controller';
import { GddService } from './services/gdd.service';
import { EntriesModule } from '../entries/entries.module';
import { SettingsModule } from '../settings/settings.module';
import { WeatherModule } from '../weather/weather.module';
import { GDD_CACHE_TTL } from './models/gdd.constants';

@Module({
  imports: [
    CacheModule.register({
      ttl: GDD_CACHE_TTL,
      max: 1000,
    }),
    EntriesModule,
    SettingsModule,
    WeatherModule,
  ],
  controllers: [GddController],
  providers: [GddService],
  exports: [GddService],
})
export class GddModule {}
