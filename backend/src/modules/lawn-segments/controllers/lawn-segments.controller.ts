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
import {
  LawnSegmentCreationRequest,
  LawnSegmentUpdateRequest,
} from '../models/lawn-segments.types';
import { Request } from 'express';
import { unwrapResult } from '../../../utils/unwrapResult';

@Controller('lawn-segments')
export class LawnSegmentsController {
  constructor(private readonly _lawnSegmentService: LawnSegmentsService) {}

  @Get()
  public getLawnSegments(@Req() req: Request) {
    return this._lawnSegmentService.getLawnSegments(req.user.userId);
  }

  @Post()
  public createLawnSegment(
    @Req() req: Request,
    @Body() lawnSegment: LawnSegmentCreationRequest,
  ) {
    return this._lawnSegmentService.createLawnSegment(
      req.user.userId,
      lawnSegment,
    );
  }

  @Put(':id')
  public async updateLawnSegment(
    @Param('id') id: number,
    @Body() updateData: LawnSegmentUpdateRequest,
  ) {
    return unwrapResult(
      await this._lawnSegmentService.updateLawnSegment(id, updateData),
    );
  }

  @Delete(':id')
  public deleteLawnSegment(@Param('id') id: number) {
    return this._lawnSegmentService.deleteLawnSegment(id);
  }
}
