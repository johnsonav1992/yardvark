import { Injectable } from '@nestjs/common';
import { EntryCreationRequest } from '../models/entries.types';
import { Repository } from 'typeorm';
import { Entry } from '../models/entries.model';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private _entriesRepo: Repository<Entry>,
  ) {}

  getEntries(userId: number) {
    return this._entriesRepo.find({
      where: { userId },
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
