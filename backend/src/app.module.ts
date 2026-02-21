import { Module } from '@nestjs/common';
import { SettingsModule } from './modules/settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ActivitiesModule } from './modules/activities/activities.module';
import { LawnSegmentsModule } from './modules/lawn-segments/lawn-segments.module';
import { EntriesModule } from './modules/entries/entries.module';
import { ProductsModule } from './modules/products/products.module';
import { JwtStrategy } from './guards/jwt.strategy';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './guards/auth.guard';
import { FeatureFlagGuard } from './guards/feature-flag.guard';
import { UsersController } from './modules/users/controllers/users.controller';
import { UsersService } from './modules/users/services/users.service';
import { UsersModule } from './modules/users/users.module';
import { HttpModule } from '@nestjs/axios';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { dataSource } from './db.config';
import { FilesModule } from './modules/files/files.module';
import { FilesController } from './modules/files/controllers/files.controller';
import { S3Service } from './modules/s3/s3.service';
import { WeatherModule } from './modules/weather/weather.module';
import { AiModule } from './modules/ai/ai.module';
import { EmailModule } from './modules/email/email.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GddModule } from './modules/gdd/gdd.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { SubscriptionGuard } from './guards/subscription.guard';
import { LoggingInterceptor } from './logger/logger';
import { DatabaseTelemetryService } from './db/database-telemetry.service';
import { SoilDataModule } from './modules/soil-data/soil-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    TypeOrmModule.forRoot(dataSource.options),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    SettingsModule,
    ActivitiesModule,
    LawnSegmentsModule,
    EntriesModule,
    ProductsModule,
    UsersModule,
    HttpModule,
    EquipmentModule,
    AnalyticsModule,
    FilesModule,
    WeatherModule,
    HttpModule,
    AiModule,
    EmailModule,
    GddModule,
    SubscriptionModule,
    SoilDataModule,
  ],
  controllers: [UsersController, FilesController],
  providers: [
    DatabaseTelemetryService,
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureFlagGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    UsersService,
    S3Service,
  ],
})
export class AppModule {}
