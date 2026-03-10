import { BadRequestException } from "@nestjs/common";
import {
	VALID_ENTRY_VIEWS,
	VALID_GRASS_TYPES,
	VALID_TEMPERATURE_UNITS,
} from "../models/settings.constants";
import type { SettingsData } from "../models/settings.types";

export const validateSettings = (settingsData: SettingsData): void => {
	if (!VALID_TEMPERATURE_UNITS.includes(settingsData.temperatureUnit)) {
		throw new BadRequestException("Invalid temperatureUnit");
	}

	if (!VALID_GRASS_TYPES.includes(settingsData.grassType)) {
		throw new BadRequestException("Invalid grassType");
	}

	if (!VALID_ENTRY_VIEWS.includes(settingsData.entryView)) {
		throw new BadRequestException("Invalid entryView");
	}

	if (typeof settingsData.lawnSize !== "number" || settingsData.lawnSize < 0) {
		throw new BadRequestException("Invalid lawnSize");
	}

	if (
		typeof settingsData.location?.lat !== "number" ||
		typeof settingsData.location?.long !== "number" ||
		settingsData.location.lat < -90 ||
		settingsData.location.lat > 90 ||
		settingsData.location.long < -180 ||
		settingsData.location.long > 180
	) {
		throw new BadRequestException("Invalid location");
	}

	if (
		typeof settingsData.location.address !== "string" ||
		settingsData.location.address.length > 500
	) {
		throw new BadRequestException("Invalid location address");
	}

	if (
		!Array.isArray(settingsData.hiddenWidgets) ||
		!Array.isArray(settingsData.widgetOrder) ||
		!Array.isArray(settingsData.mobileNavbarItems)
	) {
		throw new BadRequestException("Invalid widget arrays");
	}

	if (
		settingsData.customGddTarget !== undefined &&
		(typeof settingsData.customGddTarget !== "number" ||
			settingsData.customGddTarget < 0)
	) {
		throw new BadRequestException("Invalid customGddTarget");
	}
};
