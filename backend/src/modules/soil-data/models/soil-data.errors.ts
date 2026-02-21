import {
	ExternalServiceError,
	ResourceValidationError,
	ResourceNotFound,
} from "../../../errors/resource-error";

export class OpenMeteoFetchError extends ExternalServiceError {
	constructor(originalError?: Error | unknown) {
		super({
			message: "Failed to fetch soil data from Open-Meteo API",
			code: "OPEN_METEO_FETCH_ERROR",
			error: originalError,
		});
	}
}

export class InvalidDateFormatError extends ResourceValidationError {
	constructor() {
		super({
			message: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
			code: "INVALID_DATE_FORMAT",
		});
	}
}

export class UserSettingsNotFoundError extends ResourceNotFound {
	constructor() {
		super({
			message: "User settings not found",
			code: "USER_SETTINGS_NOT_FOUND",
		});
	}
}

export class UserLocationNotConfiguredError extends ResourceValidationError {
	constructor() {
		super({
			message:
				"User location not configured. Please set your location in settings.",
			code: "USER_LOCATION_NOT_CONFIGURED",
		});
	}
}
