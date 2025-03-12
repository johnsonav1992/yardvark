import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry } from './models/entries.model';

@Module({
  imports: [TypeOrmModule.forFeature([Entry])],
  exports: [TypeOrmModule],
  controllers: [],
  providers: [],
})
export class EntriesModule {}
