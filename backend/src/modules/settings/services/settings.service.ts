import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Settings } from "../models/settings.model";
import { Repository } from "typeorm";
import { SettingsData, SettingsResponse } from "../models/settings.types";
import { Stringified } from "src/types/json-modified";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";

@Injectable()
export class SettingsService {
	constructor(
		@InjectRepository(Settings)
		private readonly _settingsRepo: Repository<Settings>,
	) {}

	public async getUserSettings(userId: string): Promise<SettingsResponse | []> {
		const settings = await this._settingsRepo.findOneBy({ userId });
		const settingsValue = settings?.value as Stringified<SettingsData>;

		if (!settings) {
			LogHelpers.addBusinessContext(BusinessContextKeys.settingsFound, false);
			return [];
		}

		LogHelpers.addBusinessContext(BusinessContextKeys.settingsFound, true);

		return {
			...settings,
			value: JSON.parse(settingsValue),
		};
	}

	public async updateSettings(
		userId: string,
		settings: Stringified<SettingsData>,
	): Promise<SettingsData> {
		const userSettings = await this._settingsRepo.findBy({ userId });
		const newSettings = JSON.parse(settings);

		if (userSettings.length) {
			await this._settingsRepo.update({ userId }, { value: settings });
			LogHelpers.addBusinessContext(BusinessContextKeys.settingsUpdated, true);
		} else {
			await this._settingsRepo.save({ value: settings, userId });
			LogHelpers.addBusinessContext(BusinessContextKeys.settingsCreated, true);
		}

		return newSettings;
	}
}
