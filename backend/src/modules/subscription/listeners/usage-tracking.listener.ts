import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionService } from '../services/subscription.service';
import { EntryCreatedEvent } from '../../../events/entry-created.event';
import { BatchEntriesCreatedEvent } from '../../../events/batch-entries-created.event';
import { LogHelpers } from '../../../logger/logger.helpers';
import { EventHandlerHelpers } from '../../../logger/event-handler.helpers';

@Injectable()
export class UsageTrackingListener {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @OnEvent('entry.created', { async: true })
  public async handleEntryCreated(event: EntryCreatedEvent): Promise<void> {
    await EventHandlerHelpers.withLoggingContext('entry.created', async () => {
      LogHelpers.addBusinessContext('event_handler', 'entry.created');
      LogHelpers.addBusinessContext('user_id', event.userId);
      LogHelpers.addBusinessContext('entry_id', event.entryId);

      const result = await this.subscriptionService.incrementUsage(
        event.userId,
        event.feature,
      );

      if (result.isError()) {
        LogHelpers.addBusinessContext(
          'usage_increment_error',
          result.value.message,
        );
      } else {
        LogHelpers.addBusinessContext('usage_incremented', true);
      }
    });
  }

  @OnEvent('entries.batch.created', { async: true })
  public async handleBatchEntriesCreated(
    event: BatchEntriesCreatedEvent,
  ): Promise<void> {
    await EventHandlerHelpers.withLoggingContext(
      'entries.batch.created',
      async () => {
        LogHelpers.addBusinessContext('event_handler', 'entries.batch.created');
        LogHelpers.addBusinessContext('user_id', event.userId);
        LogHelpers.addBusinessContext('count', event.count);

        const result = await this.subscriptionService.incrementUsageBatch(
          event.userId,
          event.feature,
          event.count,
        );

        if (result.isError()) {
          LogHelpers.addBusinessContext(
            'usage_increment_batch_error',
            result.value.message,
          );
        } else {
          LogHelpers.addBusinessContext('usage_batch_incremented', true);
        }
      },
    );
  }
}
