import { Injectable } from '@nestjs/common';
import { EntryCreationRequest } from '../models/entries.types';
import { Between, Repository } from 'typeorm';
import { Entry } from '../models/entries.model';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private _entriesRepo: Repository<Entry>,
  ) {}

  async getEntries(userId: string, startDate?: string, endDate?: string) {
    return this._entriesRepo.find({
      where: {
        userId,
        date:
          startDate && endDate
            ? Between(new Date(startDate), new Date(endDate))
            : undefined,
      },
      relations: {
        activities: true,
        lawnSegments: true,
      },
    });
  }

  async createEntry(entry: EntryCreationRequest) {
    const newEntry = this._entriesRepo.create({
      ...entry,
      activities: entry.activityIds?.map((id) => ({ id })),
      lawnSegments: entry.lawnSegmentIds?.map((id) => ({ id })),
    });

    await this._entriesRepo.save(newEntry);
  }
}
