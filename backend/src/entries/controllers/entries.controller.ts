import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { EntriesService } from '../services/entries.service';
import { EntryCreationRequest } from '../models/entries.types';
import { Request } from 'express';

@Controller('entries')
export class EntriesController {
  constructor(private _entriesService: EntriesService) {}

  @Get()
  getEntries(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this._entriesService.getEntries(
      req.user!.userId!,
      startDate,
      endDate,
    );
  }

  @Get('single/:entryId')
  getEntry(@Param('entryId') entryId: number) {
    return this._entriesService.getEntry(entryId);
  }

  @Get('single/by-date/:date')
  getEntryByDate(@Req() req: Request, @Param('date') date: string) {
    return this._entriesService.getEntryByDate(req.user!.userId!, date);
  }

  @Get('single/most-recent/:userId')
  getMostRecentEntry(@Param('userId') userId: string) {
    return this._entriesService.getMostRecentEntry(userId);
  }

  @Post()
  createEntry(@Body() entry: EntryCreationRequest) {
    return this._entriesService.createEntry(entry);
  }

  @Put(':entryId')
  updateEntry(
    @Param('entryId') entryId: number,
    @Body() entry: Partial<EntryCreationRequest>,
  ) {
    return this._entriesService.updateEntry(entryId, entry);
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
