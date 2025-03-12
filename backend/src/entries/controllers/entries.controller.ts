import { Body, Controller, Get, Post } from '@nestjs/common';
import { EntriesService } from '../services/entries.service';
import { EntryCreationRequest } from '../models/entries.types';

@Controller('entries')
export class EntriesController {
  constructor(private _entriesService: EntriesService) {}

  @Get(':userId')
  getEntries(userId: number) {
    return this._entriesService.getEntries(userId);
  }

  @Post()
  createEntry(@Body() entry: EntryCreationRequest) {
    return this._entriesService.createEntry(entry);
  }
}
