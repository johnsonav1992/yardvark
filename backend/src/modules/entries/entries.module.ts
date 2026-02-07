import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry, EntryImage, EntryProduct } from './models/entries.model';
import { EntriesController } from './controllers/entries.controller';
import { EntriesService } from './services/entries.service';
import { S3Service } from 'src/modules/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entry, EntryProduct, EntryImage]),
    HttpModule,
    SubscriptionModule,
  ],
  exports: [TypeOrmModule, EntriesService],
  controllers: [EntriesController],
  providers: [EntriesService, S3Service, ConfigService],
})
export class EntriesModule {}
