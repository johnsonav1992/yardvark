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
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';

@Controller('lawn-segments')
export class LawnSegmentsController {
  constructor(private readonly _lawnSegmentService: LawnSegmentsService) {}

  @Get()
  public getLawnSegments(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'get_lawn_segments',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    return this._lawnSegmentService.getLawnSegments(userId);
  }

  @Post()
  public createLawnSegment(
    @User('userId') userId: string,
    @Body() lawnSegment: LawnSegmentCreationRequest,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'create_lawn_segment',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    return this._lawnSegmentService.createLawnSegment(userId, lawnSegment);
  }

  @Put(':id')
  public async updateLawnSegment(
    @Param('id') id: number,
    @Body() updateData: LawnSegmentUpdateRequest,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'update_lawn_segment',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.lawnSegmentId, id);

    return resultOrThrow(
      await this._lawnSegmentService.updateLawnSegment(id, updateData),
    );
  }

  @Delete(':id')
  public deleteLawnSegment(@Param('id') id: number) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'delete_lawn_segment',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.lawnSegmentId, id);

    return this._lawnSegmentService.deleteLawnSegment(id);
  }
}
