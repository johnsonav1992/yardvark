import { Body, Controller, Post } from '@nestjs/common';
import { EntriesService } from '../services/entries.service';
import { EntryCreationRequest } from '../models/entries.types';

@Controller('entries')
export class EntriesController {
  constructor(private _entriesService: EntriesService) {}

  @Post()
  createEntry(@Body() entry: EntryCreationRequest) {
    return this._entriesService.createEntry(entry);
  }
}
