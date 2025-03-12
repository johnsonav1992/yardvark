import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './models/activities.model';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  exports: [TypeOrmModule],
  controllers: [],
  providers: [],
})
export class ActivitiesModule {}
