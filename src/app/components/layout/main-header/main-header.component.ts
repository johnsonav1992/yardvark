import { Component, computed, inject, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "@auth0/auth0-angular";
import type { AvatarDesignTokens } from "@primeuix/themes/types/avatar";
import type { MenuItem } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { type Menu, MenuModule } from "primeng/menu";
import { environment } from "../../../../environments/environment";
import { GlobalUiService } from "../../../services/global-ui.service";
import type { YVUser } from "../../../types/user.types";
import { getUserInitials, injectUserData } from "../../../utils/authUtils";
import { fixOverlayPositionForScroll } from "../../../utils/overlayPositioningUtils";
import { SoilTemperatureDisplayComponent } from "./soil-temperature-display/soil-temperature-display.component";

@Component({
	selector: "main-header",
	imports: [
		AvatarModule,
		MenuModule,
		SoilTemperatureDisplayComponent,
		RouterLink,
		ButtonModule,
	],
	templateUrl: "./main-header.component.html",
	styleUrl: "./main-header.component.scss",
})
export class MainHeaderComponent {
	private _authService = inject(AuthService);
	private _globalUiService = inject(GlobalUiService);

	public authMenu = viewChild.required<Menu>("authMenu");

	public isMobile = this._globalUiService.isMobile;
	public isDarkMode = this._globalUiService.isDarkMode;

	public user = injectUserData();

	public showMenu(event: Event): void {
		this.authMenu().toggle(event);

		fixOverlayPositionForScroll(() =>
			this.authMenu().visible
				? this.authMenu().containerViewChild()?.nativeElement
				: null,
		);
	}

	public isDefaultPicture = computed(() =>
		this.user()?.picture?.includes("gravatar"),
	);

	public userInitials = computed(() => getUserInitials(this.user() as YVUser));

	public menuItems: MenuItem[] = [
		{
			label: "Profile",
			icon: "ti ti-user",
			routerLink: "/profile",
		},
		{
			label: "Settings",
			icon: "ti ti-settings",
			routerLink: "/settings",
		},
		{
			label: "Logout",
			icon: "ti ti-logout",
			command: () =>
				this._authService.logout({
					logoutParams: {
						returnTo: environment.feAppUrl,
					},
				}),
		},
	];

	public toggleSideNav(): void {
		this._globalUiService.isMobileSidebarOpen.update((isOpen) => !isOpen);
	}

	public avatarDt: AvatarDesignTokens = {
		root: {
			background: "{primary.400}",
			fontSize: ".9rem",
		},
	};
}
