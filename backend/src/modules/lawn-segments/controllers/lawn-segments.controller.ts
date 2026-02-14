import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { LawnSegmentsService } from '../services/lawn-segments.service';
import {
  LawnSegmentCreationRequest,
  LawnSegmentUpdateRequest,
} from '../models/lawn-segments.types';
import { unwrapResult } from '../../../utils/unwrapResult';
import { User } from '../../../decorators/user.decorator';

@Controller('lawn-segments')
export class LawnSegmentsController {
  constructor(private readonly _lawnSegmentService: LawnSegmentsService) {}

  @Get()
  public getLawnSegments(@User('userId') userId: string) {
    return this._lawnSegmentService.getLawnSegments(userId);
  }

  @Post()
  public createLawnSegment(
    @User('userId') userId: string,
    @Body() lawnSegment: LawnSegmentCreationRequest,
  ) {
    return this._lawnSegmentService.createLawnSegment(userId, lawnSegment);
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
