import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LawnSegment } from '../models/lawn-segments.model';
import { Repository } from 'typeorm';
import {
  LawnSegmentCreationRequest,
  LawnSegmentUpdateRequest,
} from '../models/lawn-segments.types';
import { LogHelpers } from '../../../logger/logger.helpers';
import { Either, error, success } from '../../../types/either';
import { LawnSegmentNotFound } from '../models/lawn-segments.errors';

@Injectable()
export class LawnSegmentsService {
  constructor(
    @InjectRepository(LawnSegment)
    private readonly _lawnSegmentRepo: Repository<LawnSegment>,
  ) {}

  public async getLawnSegments(userId: string) {
    const segments = await this._lawnSegmentRepo.findBy({ userId });

    LogHelpers.addBusinessContext('lawnSegmentsCount', segments.length);

    return segments;
  }

  public async createLawnSegment(
    userId: string,
    lawnSegment: LawnSegmentCreationRequest,
  ) {
    const lawnSeg = this._lawnSegmentRepo.create({ ...lawnSegment, userId });

    const saved = await this._lawnSegmentRepo.save(lawnSeg);

    LogHelpers.addBusinessContext('lawnSegmentCreated', saved.id);

    return saved;
  }

  public async updateLawnSegment(
    id: number,
    updateData: LawnSegmentUpdateRequest,
  ): Promise<Either<LawnSegmentNotFound, LawnSegment>> {
    LogHelpers.addBusinessContext('lawnSegmentId', id);

    const segment = await this._lawnSegmentRepo.findOneBy({ id });

    if (!segment) {
      return error(new LawnSegmentNotFound());
    }

    Object.assign(segment, updateData);

    const saved = await this._lawnSegmentRepo.save(segment);

    LogHelpers.addBusinessContext('lawnSegmentUpdated', true);

    return success(saved);
  }

  public async deleteLawnSegment(id: number) {
    LogHelpers.addBusinessContext('lawnSegmentId', id);

    const result = await this._lawnSegmentRepo.delete({ id });

    LogHelpers.addBusinessContext('lawnSegmentDeleted', true);

    return result;
  }
}
