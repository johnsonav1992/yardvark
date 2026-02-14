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
import { SubscriptionFeature } from '../../../decorators/subscription-feature.decorator';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import { unwrapResult } from '../../../utils/unwrapResult';

@Controller('entries')
export class EntriesController {
  constructor(
    private readonly _entriesService: EntriesService,
    private readonly _subscriptionService: SubscriptionService,
  ) {}

  @Get()
  public async getEntries(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return unwrapResult(
      await this._entriesService.getEntries(
        req.user.userId,
        startDate,
        endDate,
      ),
    );
  }

  @Get('single/most-recent')
  public getMostRecentEntry(@Req() req: Request) {
    return this._entriesService.getMostRecentEntry(req.user.userId);
  }

  @Get('last-mow')
  public async getLastMowDate(@Req() req: Request) {
    const lastMowDate = await this._entriesService.getLastMowDate(
      req.user.userId,
    );

    return { lastMowDate };
  }

  @Get('last-product-app')
  public async getLastProductAppDate(@Req() req: Request) {
    const lastProductAppDate =
      await this._entriesService.getLastProductApplicationDate(req.user.userId);

    return { lastProductAppDate };
  }

  @Get('last-pgr-app')
  public async getLastPgrAppDate(@Req() req: Request) {
    const lastPgrAppDate = await this._entriesService.getLastPgrApplicationDate(
      req.user.userId,
    );

    return { lastPgrAppDate };
  }

  @Get('single/by-date/:date')
  public async getEntryByDate(
    @Req() req: Request,
    @Param('date') date: string,
  ) {
    return unwrapResult(
      await this._entriesService.getEntryByDate(req.user.userId, date),
    );
  }

  @Get('single/:entryId')
  public async getEntry(@Param('entryId') entryId: number) {
    return unwrapResult(await this._entriesService.getEntry(entryId));
  }

  @Post()
  @SubscriptionFeature('entry_creation')
  public async createEntry(
    @Req() req: Request,
    @Body() entry: EntryCreationRequest,
  ) {
    const result = await this._entriesService.createEntry(
      req.user.userId,
      entry,
    );

    await this._subscriptionService.incrementUsage(
      req.user.userId,
      'entry_creation',
    );

    return result;
  }

  @Post('batch')
  public async createEntriesBatch(
    @Req() req: Request,
    @Body() body: BatchEntryCreationRequest,
  ): Promise<BatchEntryCreationResponse> {
    return this._entriesService.createEntriesBatch(req.user.userId, body);
  }

  @Put(':entryId')
  public async updateEntry(
    @Param('entryId') entryId: number,
    @Body() entry: Partial<EntryCreationRequest>,
  ) {
    return unwrapResult(await this._entriesService.updateEntry(entryId, entry));
  }

  @Delete(':entryId')
  public async softDeleteEntry(@Param('entryId') entryId: number) {
    return unwrapResult(await this._entriesService.softDeleteEntry(entryId));
  }

  @Post('recover/:entryId')
  public recoverEntry(@Param('entryId') entryId: number) {
    return this._entriesService.recoverEntry(entryId);
  }

  @Post('search')
  public searchEntries(
    @Req() req: Request,
    @Body() searchCriteria: EntriesSearchRequest,
  ) {
    return this._entriesService.searchEntries(req.user.userId, searchCriteria);
  }

  @Delete('entry-image/:entryImageId')
  public deleteEntryImage(@Param('entryImageId') entryImageId: number) {
    return this._entriesService.softDeleteEntryImage(entryImageId);
  }
}
