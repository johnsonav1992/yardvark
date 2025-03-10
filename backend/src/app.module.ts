import { Module } from '@nestjs/common';
import { SettingsModule } from './settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
