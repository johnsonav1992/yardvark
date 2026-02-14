import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EntriesService } from '../services/entries.service';
import {
  BatchEntryCreationRequest,
  BatchEntryCreationResponse,
  EntriesSearchRequest,
  EntryCreationRequest,
} from '../models/entries.types';
import { User } from '../../../decorators/user.decorator';
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
    @User('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return unwrapResult(
      await this._entriesService.getEntries(userId, startDate, endDate),
    );
  }

  @Get('single/most-recent')
  public getMostRecentEntry(@User('userId') userId: string) {
    return this._entriesService.getMostRecentEntry(userId);
  }

  @Get('last-mow')
  public async getLastMowDate(@User('userId') userId: string) {
    const lastMowDate = await this._entriesService.getLastMowDate(userId);

    return { lastMowDate };
  }

  @Get('last-product-app')
  public async getLastProductAppDate(@User('userId') userId: string) {
    const lastProductAppDate =
      await this._entriesService.getLastProductApplicationDate(userId);

    return { lastProductAppDate };
  }

  @Get('last-pgr-app')
  public async getLastPgrAppDate(@User('userId') userId: string) {
    const lastPgrAppDate =
      await this._entriesService.getLastPgrApplicationDate(userId);

    return { lastPgrAppDate };
  }

  @Get('single/by-date/:date')
  public async getEntryByDate(
    @User('userId') userId: string,
    @Param('date') date: string,
  ) {
    return unwrapResult(
      await this._entriesService.getEntryByDate(userId, date),
    );
  }

  @Get('single/:entryId')
  public async getEntry(@Param('entryId') entryId: number) {
    return unwrapResult(await this._entriesService.getEntry(entryId));
  }

  @Post()
  @SubscriptionFeature('entry_creation')
  public async createEntry(
    @User('userId') userId: string,
    @Body() entry: EntryCreationRequest,
  ) {
    const result = await this._entriesService.createEntry(userId, entry);

    await this._subscriptionService.incrementUsage(userId, 'entry_creation');

    return result;
  }

  @Post('batch')
  public async createEntriesBatch(
    @User('userId') userId: string,
    @Body() body: BatchEntryCreationRequest,
  ): Promise<BatchEntryCreationResponse> {
    return this._entriesService.createEntriesBatch(userId, body);
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
    @User('userId') userId: string,
    @Body() searchCriteria: EntriesSearchRequest,
  ) {
    return this._entriesService.searchEntries(userId, searchCriteria);
  }

  @Delete('entry-image/:entryImageId')
  public deleteEntryImage(@Param('entryImageId') entryImageId: number) {
    return this._entriesService.softDeleteEntryImage(entryImageId);
  }
}
