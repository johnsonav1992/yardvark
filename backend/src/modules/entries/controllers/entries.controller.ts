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
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { LogHelpers } from '../../../logger/logger.helpers';

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
    LogHelpers.addBusinessContext('controller_operation', 'get_entries');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('start_date', startDate);
    LogHelpers.addBusinessContext('end_date', endDate);

    return resultOrThrow(
      await this._entriesService.getEntries(userId, startDate, endDate),
    );
  }

  @Get('single/most-recent')
  public getMostRecentEntry(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'get_most_recent_entry',
    );
    LogHelpers.addBusinessContext('user_id', userId);

    return this._entriesService.getMostRecentEntry(userId);
  }

  @Get('last-mow')
  public async getLastMowDate(@User('userId') userId: string) {
    LogHelpers.addBusinessContext('controller_operation', 'get_last_mow_date');
    LogHelpers.addBusinessContext('user_id', userId);

    const lastMowDate = await this._entriesService.getLastMowDate(userId);

    return { lastMowDate };
  }

  @Get('last-product-app')
  public async getLastProductAppDate(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'get_last_product_app_date',
    );
    LogHelpers.addBusinessContext('user_id', userId);

    const lastProductAppDate =
      await this._entriesService.getLastProductApplicationDate(userId);

    return { lastProductAppDate };
  }

  @Get('last-pgr-app')
  public async getLastPgrAppDate(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'get_last_pgr_app_date',
    );
    LogHelpers.addBusinessContext('user_id', userId);

    const lastPgrAppDate =
      await this._entriesService.getLastPgrApplicationDate(userId);

    return { lastPgrAppDate };
  }

  @Get('single/by-date/:date')
  public async getEntryByDate(
    @User('userId') userId: string,
    @Param('date') date: string,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'get_entry_by_date');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('date', date);

    return resultOrThrow(
      await this._entriesService.getEntryByDate(userId, date),
    );
  }

  @Get('single/:entryId')
  public async getEntry(@Param('entryId') entryId: number) {
    LogHelpers.addBusinessContext('controller_operation', 'get_entry');
    LogHelpers.addBusinessContext('entry_id', entryId);

    return resultOrThrow(await this._entriesService.getEntry(entryId));
  }

  @Post()
  @SubscriptionFeature('entry_creation')
  public async createEntry(
    @User('userId') userId: string,
    @Body() entry: EntryCreationRequest,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'create_entry');
    LogHelpers.addBusinessContext('user_id', userId);

    const result = await this._entriesService.createEntry(userId, entry);

    await this._subscriptionService.incrementUsage(userId, 'entry_creation');

    return result;
  }

  @Post('batch')
  public async createEntriesBatch(
    @User('userId') userId: string,
    @Body() body: BatchEntryCreationRequest,
  ): Promise<BatchEntryCreationResponse> {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'create_entries_batch',
    );
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('batch_size', body.entries.length);

    return this._entriesService.createEntriesBatch(userId, body);
  }

  @Put(':entryId')
  public async updateEntry(
    @Param('entryId') entryId: number,
    @Body() entry: Partial<EntryCreationRequest>,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'update_entry');
    LogHelpers.addBusinessContext('entry_id', entryId);

    return resultOrThrow(
      await this._entriesService.updateEntry(entryId, entry),
    );
  }

  @Delete(':entryId')
  public async softDeleteEntry(@Param('entryId') entryId: number) {
    LogHelpers.addBusinessContext('controller_operation', 'delete_entry');
    LogHelpers.addBusinessContext('entry_id', entryId);

    return resultOrThrow(await this._entriesService.softDeleteEntry(entryId));
  }

  @Post('recover/:entryId')
  public recoverEntry(@Param('entryId') entryId: number) {
    LogHelpers.addBusinessContext('controller_operation', 'recover_entry');
    LogHelpers.addBusinessContext('entry_id', entryId);

    return this._entriesService.recoverEntry(entryId);
  }

  @Post('search')
  public async searchEntries(
    @User('userId') userId: string,
    @Body() searchCriteria: EntriesSearchRequest,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'search_entries');
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(
      await this._entriesService.searchEntries(userId, searchCriteria),
    );
  }

  @Delete('entry-image/:entryImageId')
  public deleteEntryImage(@Param('entryImageId') entryImageId: number) {
    LogHelpers.addBusinessContext('controller_operation', 'delete_entry_image');
    LogHelpers.addBusinessContext('entry_image_id', entryImageId);

    return this._entriesService.softDeleteEntryImage(entryImageId);
  }
}
