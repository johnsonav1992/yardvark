import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry, EntryProduct } from './models/entries.model';
import { EntriesController } from './controllers/entries.controller';
import { EntriesService } from './services/entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, EntryProduct])],
  exports: [TypeOrmModule],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
