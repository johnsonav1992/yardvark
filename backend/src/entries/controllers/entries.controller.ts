import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EntriesService } from '../services/entries.service';
import { EntryCreationRequest } from '../models/entries.types';

@Controller('entries')
export class EntriesController {
  constructor(private _entriesService: EntriesService) {}

  @Get(':userId')
  getEntries(
    userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this._entriesService.getEntries(userId, startDate, endDate);
  }

  @Get(':entryId')
  getEntry(entryId: number) {
    return this._entriesService.getEntry(entryId);
  }

  @Post()
  createEntry(@Body() entry: EntryCreationRequest) {
    return this._entriesService.createEntry(entry);
  }
}
