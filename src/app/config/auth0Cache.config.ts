import type { Cacheable } from "@auth0/auth0-angular";
import type { ICache, MaybePromise } from "@auth0/auth0-spa-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export class CustomAuth0Cache implements ICache {
	CACHE_KEY_PREFIX = "@@auth0spajs@@";

	public async set<T = Cacheable>(key: string, entry: T) {
		if (Capacitor.isNativePlatform()) {
			await Preferences.set({ key, value: JSON.stringify(entry) });
		} else {
			localStorage.setItem(key, JSON.stringify(entry));
		}
	}

	public get<T = Cacheable>(key: string): MaybePromise<T | undefined> {
		if (Capacitor.isNativePlatform()) {
			return (async () => {
				const { value: json } = await Preferences.get({ key });
				if (!json) return undefined;

				try {
					return JSON.parse(json) as T;
				} catch (e) {
					console.warn("Failed to parse cached data", e);

					return undefined;
				}
			})();
		} else {
			const json = localStorage.getItem(key);
			if (!json) return undefined;

			try {
				return JSON.parse(json) as T;
			} catch (e) {
				console.warn("Failed to parse cached data", e);

				return undefined;
			}
		}
	}

	public async remove(key: string) {
		if (Capacitor.isNativePlatform()) {
			await Preferences.remove({ key });
		} else {
			localStorage.removeItem(key);
		}
	}

	public async allKeys() {
		if (Capacitor.isNativePlatform()) {
			const { keys } = await Preferences.keys();

			return keys.filter((key) => key.startsWith(this.CACHE_KEY_PREFIX));
		} else {
			return Object.keys(localStorage).filter((key) =>
				key.startsWith(this.CACHE_KEY_PREFIX),
			);
		}
	}
}
