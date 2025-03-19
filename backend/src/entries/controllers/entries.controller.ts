import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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

  @Get('single/:entryId')
  getEntry(@Param('entryId') entryId: number) {
    return this._entriesService.getEntry(entryId);
  }

  @Post()
  createEntry(@Body() entry: EntryCreationRequest) {
    return this._entriesService.createEntry(entry);
  }

  @Delete(':entryId')
  softDeleteEntry(@Param('entryId') entryId: number) {
    return this._entriesService.softDeleteEntry(entryId);
  }

  @Post('recover/:entryId')
  recoverEntry(@Param('entryId') entryId: number) {
    return this._entriesService.recoverEntry(entryId);
  }
}
