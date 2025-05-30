import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { LawnSegmentsService } from '../services/lawn-segments.service';
import { LawnSegmentCreationRequest } from '../models/lawn-segments.types';
import { Request } from 'express';
import { LawnSegment } from '../models/lawn-segments.model';

@Controller('lawn-segments')
export class LawnSegmentsController {
  constructor(private _lawnSegmentService: LawnSegmentsService) {}

  @Get()
  getLawnSegments(@Req() req: Request) {
    return this._lawnSegmentService.getLawnSegments(req.user.userId);
  }

  @Post()
  createLawnSegment(
    @Req() req: Request,
    @Body() lawnSegment: LawnSegmentCreationRequest,
  ) {
    return this._lawnSegmentService.createLawnSegment(
      req.user.userId,
      lawnSegment,
    );
  }

  @Put(':id')
  updateLawnSegment(@Body() lawnSegment: LawnSegment) {
    return this._lawnSegmentService.updateLawnSegment(lawnSegment);
  }

  @Delete(':id')
  deleteLawnSegment(@Param('id') id: number) {
    return this._lawnSegmentService.deleteLawnSegment(id);
  }
}
