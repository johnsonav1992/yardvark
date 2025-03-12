import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LawnSegment } from '../models/lawn-segments.model';
import { Repository } from 'typeorm';
import { LawnSegmentCreationRequest } from '../models/lawn-segments.types';

@Injectable()
export class LawnSegmentsService {
  constructor(
    @InjectRepository(LawnSegment)
    private _lawnSegmentRepo: Repository<LawnSegment>,
  ) {}

  async getLawnSegments(userId: number) {
    return this._lawnSegmentRepo.findBy({ userId });
  }

  async createLawnSegment(lawnSegment: LawnSegmentCreationRequest) {
    const lawnSeg = this._lawnSegmentRepo.create(lawnSegment);

    return this._lawnSegmentRepo.save(lawnSeg);
  }
}
