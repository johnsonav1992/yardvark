import { Body, Controller, Get, Post } from '@nestjs/common';
import { LawnSegmentsService } from '../services/lawn-segments.service';
import { LawnSegmentCreationRequest } from '../models/lawn-segments.types';

@Controller('lawn-segments')
export class LawnSegmentsController {
  constructor(private _lawnSegmentService: LawnSegmentsService) {}

  @Get(':userId')
  getLawnSegments(userId: number) {
    return this._lawnSegmentService.getLawnSegments(userId);
  }

  @Post()
  createLawnSegment(@Body() lawnSegment: LawnSegmentCreationRequest) {
    return this._lawnSegmentService.createLawnSegment(lawnSegment);
  }
}
