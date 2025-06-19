import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LawnSegment } from '../models/lawn-segments.model';
import type { Repository } from 'typeorm';
import type { LawnSegmentCreationRequest } from '../models/lawn-segments.types';

@Injectable()
export class LawnSegmentsService {
	constructor(
		@InjectRepository(LawnSegment)
		private _lawnSegmentRepo: Repository<LawnSegment>
	) {}

	async getLawnSegments(userId: string) {
		return this._lawnSegmentRepo.findBy({ userId });
	}

	async createLawnSegment(
		userId: string,
		lawnSegment: LawnSegmentCreationRequest
	) {
		const lawnSeg = this._lawnSegmentRepo.create({ ...lawnSegment, userId });

		return this._lawnSegmentRepo.save(lawnSeg);
	}

	async updateLawnSegment(lawnSegment: LawnSegment) {
		return this._lawnSegmentRepo.save(lawnSegment);
	}

	async deleteLawnSegment(id: number) {
		return this._lawnSegmentRepo.delete({ id });
	}
}
