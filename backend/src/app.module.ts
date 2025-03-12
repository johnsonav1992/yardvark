import { Module } from '@nestjs/common';
import { SettingsModule } from './settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module';
import { LawnSegmentsModule } from './lawn-segments/lawn-segments.module';
import { EntriesModule } from './entries/entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DEVPGHOST,
      port: 5432,
      username: process.env.DEVPGUSER,
      password: process.env.DEVPGPASSWORD,
      database: process.env.DEVPGDATABASE,
      ssl: true,
      synchronize: true,
      autoLoadEntities: true,
    }),
    SettingsModule,
    ActivitiesModule,
    LawnSegmentsModule,
    EntriesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
