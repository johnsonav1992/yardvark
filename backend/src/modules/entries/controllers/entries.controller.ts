import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SubscriptionFeature } from "../../../decorators/subscription-feature.decorator";
import { User } from "../../../decorators/user.decorator";
import { BatchEntriesCreatedEvent } from "../../../events/batch-entries-created.event";
import { EntryCreatedEvent } from "../../../events/entry-created.event";
import { LogHelpers } from "../../../logger/logger.helpers";
import {
	BusinessContextKeys,
	EventNames,
} from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import type {
	BatchEntryCreationRequest,
	BatchEntryCreationResponse,
	EntriesSearchRequest,
	EntryCreationRequest,
} from "../models/entries.types";
import { EntriesService } from "../services/entries.service";

@Controller("entries")
export class EntriesController {
	constructor(
		private readonly _entriesService: EntriesService,
		private readonly _eventEmitter: EventEmitter2,
	) {}

	@Get()
	public async getEntries(
		@User("userId") userId: string,
		@Query("startDate") startDate: string,
		@Query("endDate") endDate: string,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_entries",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.startDate, startDate);
		LogHelpers.addBusinessContext(BusinessContextKeys.endDate, endDate);

		return resultOrThrow(
			await this._entriesService.getEntries(userId, startDate, endDate),
		);
	}

	@Get("single/most-recent")
	public getMostRecentEntry(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_most_recent_entry",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return this._entriesService.getMostRecentEntry(userId);
	}

	@Get("last-mow")
	public async getLastMowDate(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_last_mow_date",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		const lastMowDate = await this._entriesService.getLastMowDate(userId);

		return { lastMowDate };
	}

	@Get("last-product-app")
	public async getLastProductAppDate(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_last_product_app_date",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		const lastProductAppDate =
			await this._entriesService.getLastProductApplicationDate(userId);

		return { lastProductAppDate };
	}

	@Get("last-pgr-app")
	public async getLastPgrAppDate(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_last_pgr_app_date",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		const lastPgrAppDate =
			await this._entriesService.getLastPgrApplicationDate(userId);

		return { lastPgrAppDate };
	}

	@Get("single/by-date/:date")
	public async getEntryByDate(
		@User("userId") userId: string,
		@Param("date") date: string,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_entry_by_date",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.date, date);

		return resultOrThrow(
			await this._entriesService.getEntryByDate(userId, date),
		);
	}

	@Get("single/:entryId")
	public async getEntry(
		@User("userId") userId: string,
		@Param("entryId") entryId: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_entry",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.entryId, entryId);

		return resultOrThrow(await this._entriesService.getEntry(entryId, userId));
	}

	@Post()
	@SubscriptionFeature("entry_creation")
	public async createEntry(
		@User("userId") userId: string,
		@Body() entry: EntryCreationRequest,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"create_entry",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		const result = await this._entriesService.createEntry(userId, entry);

		this._eventEmitter.emit(
			EventNames.entryCreated,
			new EntryCreatedEvent(userId, result.id),
		);

		return result;
	}

	@Post("batch")
	@SubscriptionFeature("entry_creation")
	public async createEntriesBatch(
		@User("userId") userId: string,
		@Body() body: BatchEntryCreationRequest,
	): Promise<BatchEntryCreationResponse> {
		if (body.entries.length > 50) {
			throw new BadRequestException("Batch size cannot exceed 50 entries");
		}

		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"create_entries_batch",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.batchSize,
			body.entries.length,
		);

		const result = await this._entriesService.createEntriesBatch(userId, body);

		if (result.created > 0) {
			this._eventEmitter.emit(
				EventNames.batchEntriesCreated,
				new BatchEntriesCreatedEvent(userId, result.created),
			);
		}

		return result;
	}

	@Put(":entryId")
	public async updateEntry(
		@User("userId") userId: string,
		@Param("entryId") entryId: number,
		@Body() entry: Partial<EntryCreationRequest>,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"update_entry",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.entryId, entryId);

		return resultOrThrow(
			await this._entriesService.updateEntry(entryId, userId, entry),
		);
	}

	@Delete(":entryId")
	public async softDeleteEntry(
		@User("userId") userId: string,
		@Param("entryId") entryId: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"delete_entry",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.entryId, entryId);

		return resultOrThrow(
			await this._entriesService.softDeleteEntry(entryId, userId),
		);
	}

	@Post("recover/:entryId")
	public async recoverEntry(
		@User("userId") userId: string,
		@Param("entryId") entryId: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"recover_entry",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.entryId, entryId);

		return resultOrThrow(
			await this._entriesService.recoverEntry(entryId, userId),
		);
	}

	@Post("search")
	public async searchEntries(
		@User("userId") userId: string,
		@Body() searchCriteria: EntriesSearchRequest,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"search_entries",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		if (searchCriteria.titleOrNotes?.length > 500) {
			throw new BadRequestException("Search string too long");
		}

		return resultOrThrow(
			await this._entriesService.searchEntries(userId, searchCriteria),
		);
	}

	@Delete("entry-image/:entryImageId")
	public async deleteEntryImage(
		@User("userId") userId: string,
		@Param("entryImageId") entryImageId: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"delete_entry_image",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.entryImageId,
			entryImageId,
		);

		return resultOrThrow(
			await this._entriesService.softDeleteEntryImage(entryImageId, userId),
		);
	}
}
