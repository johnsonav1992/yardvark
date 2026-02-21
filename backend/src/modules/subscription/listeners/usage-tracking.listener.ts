import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { BatchEntriesCreatedEvent } from "../../../events/batch-entries-created.event";
import type { EntryCreatedEvent } from "../../../events/entry-created.event";
import { EventHandlerHelpers } from "../../../logger/event-handler.helpers";
import { LogHelpers } from "../../../logger/logger.helpers";
import {
	BusinessContextKeys,
	EventNames,
} from "../../../logger/logger-keys.constants";
import { SubscriptionService } from "../services/subscription.service";

@Injectable()
export class UsageTrackingListener {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	@OnEvent(EventNames.entryCreated, { async: true })
	public async handleEntryCreated(event: EntryCreatedEvent): Promise<void> {
		await EventHandlerHelpers.withLoggingContext(
			EventNames.entryCreated,
			async () => {
				LogHelpers.addBusinessContext(
					BusinessContextKeys.eventHandler,
					EventNames.entryCreated,
				);
				LogHelpers.addBusinessContext(BusinessContextKeys.userId, event.userId);
				LogHelpers.addBusinessContext(
					BusinessContextKeys.entryId,
					event.entryId,
				);

				const result = await this.subscriptionService.incrementUsage(
					event.userId,
					event.feature,
				);

				if (result.isError()) {
					LogHelpers.addBusinessContext(
						BusinessContextKeys.usageIncrementError,
						result.value.message,
					);
				} else {
					LogHelpers.addBusinessContext(
						BusinessContextKeys.usageIncremented,
						true,
					);
				}
			},
		);
	}

	@OnEvent(EventNames.batchEntriesCreated, { async: true })
	public async handleBatchEntriesCreated(
		event: BatchEntriesCreatedEvent,
	): Promise<void> {
		await EventHandlerHelpers.withLoggingContext(
			EventNames.batchEntriesCreated,
			async () => {
				LogHelpers.addBusinessContext(
					BusinessContextKeys.eventHandler,
					EventNames.batchEntriesCreated,
				);
				LogHelpers.addBusinessContext(BusinessContextKeys.userId, event.userId);
				LogHelpers.addBusinessContext(BusinessContextKeys.count, event.count);

				const result = await this.subscriptionService.incrementUsageBatch(
					event.userId,
					event.feature,
					event.count,
				);

				if (result.isError()) {
					LogHelpers.addBusinessContext(
						BusinessContextKeys.usageIncrementBatchError,
						result.value.message,
					);
				} else {
					LogHelpers.addBusinessContext(
						BusinessContextKeys.usageBatchIncremented,
						true,
					);
				}
			},
		);
	}
}
