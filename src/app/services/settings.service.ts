import { httpResource } from "@angular/common/http";
import { effect, Injectable, inject, linkedSignal } from "@angular/core";
import type {
	SettingsData,
	SettingsResponse,
} from "../../../backend/src/modules/settings/models/settings.types";
import { apiUrl, putReq } from "../utils/httpUtils";

const SETTINGS_CACHE_KEY = "yv_settings_cache";

@Injectable({
	providedIn: "root",
})
export class SettingsService {
	public settings = httpResource<SettingsResponse>(() => apiUrl("settings"));

	public currentSettings = linkedSignal<SettingsData | undefined>(
		() => this.settings.value()?.value ?? this._getCachedSettings() ?? undefined,
	);

	constructor() {
		effect(() => {
			const current = this.currentSettings();

			if (current) {
				try {
					localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(current));
				} catch {
					// ignore storage errors
				}
			}
		});
	}

	private _getCachedSettings(): SettingsData | null {
		try {
			const cached = localStorage.getItem(SETTINGS_CACHE_KEY);

			return cached ? (JSON.parse(cached) as SettingsData) : null;
		} catch {
			return null;
		}
	}

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
