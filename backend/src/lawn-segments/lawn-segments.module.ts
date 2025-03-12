import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LawnSegment } from './models/lawn-segments.model';

@Module({
  imports: [TypeOrmModule.forFeature([LawnSegment])],
  exports: [TypeOrmModule],
  controllers: [],
  providers: [],
})
export class LawnSegmentsModule {}
