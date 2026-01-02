import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LawnSegment } from '../models/lawn-segments.model';
import { Repository } from 'typeorm';
import {
  LawnSegmentCreationRequest,
  LawnSegmentUpdateRequest,
} from '../models/lawn-segments.types';

@Injectable()
export class LawnSegmentsService {
  constructor(
    @InjectRepository(LawnSegment)
    private _lawnSegmentRepo: Repository<LawnSegment>,
  ) {}

  async getLawnSegments(userId: string) {
    return this._lawnSegmentRepo.findBy({ userId });
  }

  async createLawnSegment(
    userId: string,
    lawnSegment: LawnSegmentCreationRequest,
  ) {
    const lawnSeg = this._lawnSegmentRepo.create({ ...lawnSegment, userId });

    return this._lawnSegmentRepo.save(lawnSeg);
  }

  async updateLawnSegment(id: number, updateData: LawnSegmentUpdateRequest) {
    const segment = await this._lawnSegmentRepo.findOneBy({ id });

    if (!segment) {
      throw new Error('Lawn segment not found');
    }

    Object.assign(segment, updateData);

    return this._lawnSegmentRepo.save(segment);
  }

  async deleteLawnSegment(id: number) {
    return this._lawnSegmentRepo.delete({ id });
  }
}
