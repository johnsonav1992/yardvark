import { httpResource } from "@angular/common/http";
import { Injectable, inject, linkedSignal } from "@angular/core";
import type {
	SettingsData,
	SettingsResponse,
} from "../../../backend/src/modules/settings/models/settings.types";
import { apiUrl, putReq } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class SettingsService {
	public settings = httpResource<SettingsResponse>(() => apiUrl("settings"));

	public currentSettings = linkedSignal(() => this.settings.value()?.value);

	public updateSetting = <
		TKey extends keyof SettingsData,
		TValue extends SettingsData[TKey],
	>(
		settingName: TKey,
		newValue: TValue,
	): void => {
		const updatedSettings: SettingsData = {
			...this.currentSettings()!,
			[settingName]: newValue,
		};

		this.currentSettings.update((currSettings) => ({
			...currSettings,
			...updatedSettings,
		}));

		putReq<SettingsData>(apiUrl("settings"), updatedSettings).subscribe({
			next: (updatedSettingsRes) =>
				this.currentSettings.update((currSettings) => ({
					...currSettings,
					...updatedSettingsRes,
				})),
		});
	};
}

export const injectSettingsService = () => inject(SettingsService);
