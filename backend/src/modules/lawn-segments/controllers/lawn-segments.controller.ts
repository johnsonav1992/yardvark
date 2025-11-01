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
import { UpdateLawnSegmentDto } from '../models/lawn-segments.dto';

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
  updateLawnSegment(
    @Param('id') id: number,
    @Body() updateDto: UpdateLawnSegmentDto,
  ) {
    return this._lawnSegmentService.updateLawnSegment(id, updateDto);
  }

  @Delete(':id')
  deleteLawnSegment(@Param('id') id: number) {
    return this._lawnSegmentService.deleteLawnSegment(id);
  }
}
