import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LawnSegment } from '../models/lawn-segments.model';
import { Repository } from 'typeorm';
import {
  LawnSegmentCreationRequest,
  LawnSegmentUpdateRequest,
} from '../models/lawn-segments.types';
import { LogHelpers } from '../../../logger/logger.helpers';

@Injectable()
export class LawnSegmentsService {
  constructor(
    @InjectRepository(LawnSegment)
    private _lawnSegmentRepo: Repository<LawnSegment>,
  ) {}

  async getLawnSegments(userId: string) {
    const segments = await LogHelpers.withDatabaseTelemetry(() =>
      this._lawnSegmentRepo.findBy({ userId }),
    );

    LogHelpers.addBusinessContext('lawnSegmentsCount', segments.length);

    return segments;
  }

  async createLawnSegment(
    userId: string,
    lawnSegment: LawnSegmentCreationRequest,
  ) {
    const lawnSeg = this._lawnSegmentRepo.create({ ...lawnSegment, userId });

    const saved = await LogHelpers.withDatabaseTelemetry(() =>
      this._lawnSegmentRepo.save(lawnSeg),
    );

    LogHelpers.addBusinessContext('lawnSegmentCreated', saved.id);

    return saved;
  }

  async updateLawnSegment(id: number, updateData: LawnSegmentUpdateRequest) {
    LogHelpers.addBusinessContext('lawnSegmentId', id);

    const segment = await LogHelpers.withDatabaseTelemetry(() =>
      this._lawnSegmentRepo.findOneBy({ id }),
    );

    if (!segment) {
      throw new Error('Lawn segment not found');
    }

    Object.assign(segment, updateData);

    const saved = await LogHelpers.withDatabaseTelemetry(() =>
      this._lawnSegmentRepo.save(segment),
    );

    LogHelpers.addBusinessContext('lawnSegmentUpdated', true);

    return saved;
  }

  async deleteLawnSegment(id: number) {
    LogHelpers.addBusinessContext('lawnSegmentId', id);

    const result = await LogHelpers.withDatabaseTelemetry(() =>
      this._lawnSegmentRepo.delete({ id }),
    );

    LogHelpers.addBusinessContext('lawnSegmentDeleted', true);

    return result;
  }
}
