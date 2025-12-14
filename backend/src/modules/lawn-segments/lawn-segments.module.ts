import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LawnSegment } from './models/lawn-segments.model';
import { LawnSegmentsController } from './controllers/lawn-segments.controller';
import { LawnSegmentsService } from './services/lawn-segments.service';
import { LawnSegmentsResolver } from './resolvers/lawn-segments.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([LawnSegment])],
  exports: [TypeOrmModule],
  controllers: [LawnSegmentsController],
  providers: [LawnSegmentsService, LawnSegmentsResolver],
})
export class LawnSegmentsModule {}
