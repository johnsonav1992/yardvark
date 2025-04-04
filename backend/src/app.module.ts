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

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PRODPGHOST,
      port: 5432,
      username: process.env.PRODPGUSER,
      password: process.env.PRODPGPASSWORD,
      database: process.env.PRODPGDATABASE,
      ssl: true,
      synchronize: true,
      autoLoadEntities: true,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    SettingsModule,
    ActivitiesModule,
    LawnSegmentsModule,
    EntriesModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
