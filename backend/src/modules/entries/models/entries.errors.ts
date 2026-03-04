import {
	ResourceNotFound,
	ResourceValidationError,
} from "../../../errors/resource-error";

export class EntryNotFound extends ResourceNotFound {
	constructor() {
		super({
			message: "Entry not found",
			code: "ENTRY_NOT_FOUND",
		});
	}
}

export class EntriesNotFound extends ResourceNotFound {
	constructor() {
		super({
			message: "Entries not found",
			code: "ENTRIES_NOT_FOUND",
		});
	}
}

export class InvalidDateRange extends ResourceValidationError {
	constructor() {
		super({
			message: "Invalid date range provided",
			code: "INVALID_DATE_RANGE",
		});
	}
}
