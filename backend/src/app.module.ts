import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
      entities: [],
      synchronize: true,
    }),
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
