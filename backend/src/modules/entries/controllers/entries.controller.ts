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
import {
  BatchEntryCreationRequest,
  BatchEntryCreationResponse,
  EntriesSearchRequest,
  EntryCreationRequest,
} from '../models/entries.types';
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
      req.user.userId,
      startDate,
      endDate,
      req,
    );
  }

  @Get('single/most-recent')
  getMostRecentEntry(@Req() req: Request) {
    return this._entriesService.getMostRecentEntry(req.user.userId);
  }

  @Get('last-mow')
  async getLastMowDate(@Req() req: Request) {
    const lastMowDate = await this._entriesService.getLastMowDate(
      req.user.userId,
    );

    return { lastMowDate };
  }

  @Get('last-product-app')
  async getLastProductAppDate(@Req() req: Request) {
    const lastProductAppDate =
      await this._entriesService.getLastProductApplicationDate(req.user.userId);

    return { lastProductAppDate };
  }

  @Get('last-pgr-app')
  async getLastPgrAppDate(@Req() req: Request) {
    const lastPgrAppDate = await this._entriesService.getLastPgrApplicationDate(
      req.user.userId,
    );

    return { lastPgrAppDate };
  }

  @Get('single/by-date/:date')
  getEntryByDate(@Req() req: Request, @Param('date') date: string) {
    return this._entriesService.getEntryByDate(req.user.userId, date);
  }

  @Get('single/:entryId')
  getEntry(@Req() req: Request, @Param('entryId') entryId: number) {
    return this._entriesService.getEntry(entryId, req);
  }

  @Post()
  async createEntry(@Req() req: Request, @Body() entry: EntryCreationRequest) {
    return this._entriesService.createEntry(req.user.userId, entry, req);
  }

  @Post('batch')
  async createEntriesBatch(
    @Req() req: Request,
    @Body() body: BatchEntryCreationRequest,
  ): Promise<BatchEntryCreationResponse> {
    return this._entriesService.createEntriesBatch(req.user.userId, body);
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

  @Post('search')
  searchEntries(
    @Req() req: Request,
    @Body() searchCriteria: EntriesSearchRequest,
  ) {
    return this._entriesService.searchEntries(
      req.user.userId,
      searchCriteria,
      req,
    );
  }

  @Delete('entry-image/:entryImageId')
  deleteEntryImage(@Param('entryImageId') entryImageId: number) {
    return this._entriesService.softDeleteEntryImage(entryImageId);
  }
}
