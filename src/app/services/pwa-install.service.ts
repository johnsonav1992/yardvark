import { computed, Injectable, signal } from "@angular/core";
import { Capacitor } from "@capacitor/core";

const PWA_INSTALL_DISMISSED_KEY = "yv-pwa-install-dismissed";

@Injectable({
	providedIn: "root",
})
export class PwaInstallService {
	private _deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);

	private _isStandalone = signal(
		window.matchMedia("(display-mode: standalone)").matches ||
			!!(navigator as Navigator & { standalone?: boolean }).standalone,
	);

	private _isDismissed = signal(
		!!localStorage.getItem(PWA_INSTALL_DISMISSED_KEY),
	);

	private _isIosSafari = signal(this._detectIosSafari());

	public canInstallAndroid = computed(() => !!this._deferredPrompt());

	public showAndroidBanner = computed(
		() =>
			!this._isStandalone() &&
			!this._isDismissed() &&
			this.canInstallAndroid(),
	);

	public showIosBanner = computed(
		() =>
			!this._isStandalone() && !this._isDismissed() && this._isIosSafari(),
	);

	public showBanner = computed(
		() => this.showAndroidBanner() || this.showIosBanner(),
	);

	public constructor() {
		if (Capacitor.isNativePlatform()) return;

		window.addEventListener("beforeinstallprompt", (e) => {
			e.preventDefault();
			this._deferredPrompt.set(e);
		});
	}

	private _detectIosSafari(): boolean {
		const ua = navigator.userAgent;
		const isIos = /iPad|iPhone|iPod/.test(ua);
		const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);

		return isIos && isSafari;
	}

	public dismiss(): void {
		this._isDismissed.set(true);
		localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
	}

	public async triggerInstall(): Promise<void> {
		const prompt = this._deferredPrompt();

		if (!prompt) return;

		await prompt.prompt();

		const { outcome } = await prompt.userChoice;

		if (outcome === "accepted") {
			this._deferredPrompt.set(null);
		}

		this.dismiss();
	}
}
