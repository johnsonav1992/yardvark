import { Module } from '@nestjs/common';
import { SettingsModule } from './modules/settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './modules/activities/activities.module';
import { LawnSegmentsModule } from './modules/lawn-segments/lawn-segments.module';
import { EntriesModule } from './modules/entries/entries.module';
import { ProductsModule } from './modules/products/products.module';
import { JwtStrategy } from './guards/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
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
import { RemindersModule } from './modules/reminders/reminders.module';
import { AiModule } from './modules/ai/ai.module';
import { EmailModule } from './modules/email/email.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GddModule } from './modules/gdd/gdd.module';
import { AppGraphQLModule } from './graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    TypeOrmModule.forRoot(dataSource.options),
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
    RemindersModule,
    AiModule,
    EmailModule,
    GddModule,
    AppGraphQLModule,
  ],
  controllers: [UsersController, FilesController],
  providers: [
    JwtStrategy,
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
    UsersService,
    S3Service,
  ],
})
export class AppModule {}
