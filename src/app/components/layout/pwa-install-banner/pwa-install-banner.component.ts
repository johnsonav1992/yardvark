import { Component, inject } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { PwaInstallService } from "../../../services/pwa-install.service";

@Component({
	selector: "pwa-install-banner",
	imports: [ButtonModule],
	templateUrl: "./pwa-install-banner.component.html",
	styleUrl: "./pwa-install-banner.component.scss",
})
export class PwaInstallBannerComponent {
	public pwaInstallService = inject(PwaInstallService);

	public dismiss(): void {
		this.pwaInstallService.dismiss();
	}

	public install(): void {
		this.pwaInstallService.triggerInstall();
	}
}
