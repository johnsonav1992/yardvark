import { Module } from '@nestjs/common';
import { SettingsModule } from './settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module';
import { LawnSegmentsModule } from './lawn-segments/lawn-segments.module';
import { EntriesModule } from './entries/entries.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ProductsModule } from './products/products.module';
import { JwtStrategy } from './guards/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/auth.guard';
import { UsersController } from './users/controllers/users.controller';
import { UsersService } from './users/services/users.service';
import { UsersModule } from './users/users.module';
import { HttpModule } from '@nestjs/axios';
import { EquipmentModule } from './equipment/equipment.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { dataSource } from './db.config';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    TypeOrmModule.forRoot(dataSource.options),
    SettingsModule,
    ActivitiesModule,
    LawnSegmentsModule,
    EntriesModule,
    ProductsModule,
    UsersModule,
    HttpModule,
    EquipmentModule,
    AnalyticsModule,
  ],
  controllers: [UsersController],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    UsersService,
  ],
})
export class AppModule {}
