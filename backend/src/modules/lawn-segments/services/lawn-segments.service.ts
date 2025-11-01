import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LawnSegment } from '../models/lawn-segments.model';
import { Repository } from 'typeorm';
import { LawnSegmentCreationRequest } from '../models/lawn-segments.types';
import { UpdateLawnSegmentDto } from '../models/lawn-segments.dto';

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

  async updateLawnSegment(id: number, updateDto: UpdateLawnSegmentDto) {
    const segment = await this._lawnSegmentRepo.findOneBy({ id });
    if (!segment) {
      throw new Error('Lawn segment not found');
    }

    // Only update the fields that are provided
    if (updateDto.name !== undefined) segment.name = updateDto.name;
    if (updateDto.size !== undefined) segment.size = updateDto.size;
    if (updateDto.coordinates !== undefined) segment.coordinates = updateDto.coordinates;
    if (updateDto.color !== undefined) segment.color = updateDto.color;

    return this._lawnSegmentRepo.save(segment);
  }

  async deleteLawnSegment(id: number) {
    return this._lawnSegmentRepo.delete({ id });
  }
}
