import { httpResource } from "@angular/common/http";
import {
	computed,
	effect,
	Injectable,
	inject,
	linkedSignal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { AuthService } from "@auth0/auth0-angular";
import { map } from "rxjs";
import type {
	SettingsData,
	SettingsResponse,
} from "../../../backend/src/modules/settings/models/settings.types";
import { apiUrl, putReq } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class SettingsService {
	private _authService = inject(AuthService);
	private _userId = toSignal(this._authService.user$.pipe(map((u) => u?.sub)));
	private _cacheKey = computed(() => {
		const userId = this._userId();
		return userId ? `yv_settings_cache_${userId}` : null;
	});

	public settings = httpResource<SettingsResponse>(() => apiUrl("settings"));

	public currentSettings = linkedSignal<SettingsData | undefined>(
		() =>
			this.settings.value()?.value ?? this._getCachedSettings() ?? undefined,
	);

	constructor() {
		effect(() => {
			const key = this._cacheKey();
			const current = this.currentSettings();

			if (key && current) {
				try {
					localStorage.setItem(key, JSON.stringify(current));
				} catch {
					// noop - if we can't cache, we can't cache
				}
			}
		});
	}

	public clearCache(): void {
		const key = this._cacheKey();

		if (key) {
			localStorage.removeItem(key);
		}
	}

	private _getCachedSettings(): SettingsData | null {
		const key = this._cacheKey();

		if (!key) return null;

		try {
			const cached = localStorage.getItem(key);

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
