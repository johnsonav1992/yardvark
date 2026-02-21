import { Component, inject, NgZone, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterOutlet } from "@angular/router";
import { SwUpdate } from "@angular/service-worker";
import { AuthService } from "@auth0/auth0-angular";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import LogRocket from "logrocket";
import { ConfirmationService } from "primeng/api";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { catchError, mergeMap, of } from "rxjs";
import config from "../../capacitor.config";
import { environment } from "../environments/environment";
import { MainHeaderComponent } from "./components/layout/main-header/main-header.component";
import { MainSideNavComponent } from "./components/layout/main-side-nav/main-side-nav.component";
import { MobileBottomNavbarComponent } from "./components/layout/mobile-bottom-navbar/mobile-bottom-navbar.component";
import { LoadingSpinnerComponent } from "./components/miscellanious/loading-spinner/loading-spinner.component";
import { ChangelogService } from "./services/changelog.service";
import { GlobalUiService } from "./services/global-ui.service";

@Component({
	selector: "app-root",
	imports: [
		RouterOutlet,
		MainHeaderComponent,
		MainSideNavComponent,
		MobileBottomNavbarComponent,
		ToastModule,
		LoadingSpinnerComponent,
		ConfirmDialog,
	],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	private _auth = inject(AuthService);
	private _globalUiService = inject(GlobalUiService);
	private _swUpdate = inject(SwUpdate);
	private _confirmationService = inject(ConfirmationService);
	private _changelogService = inject(ChangelogService);
	private _ngZone = inject(NgZone);

	public isMobile = this._globalUiService.isMobile;

	public isLoggedIn = signal(false);
	public isAuthLoading = toSignal(this._auth.isLoading$);

	public constructor() {
		if (this._swUpdate.isEnabled) {
			this._swUpdate.versionUpdates.subscribe((event) => {
				if (event.type === "VERSION_READY") {
					this.showUpdateDialog();
				}
			});
		}
	}

	private showUpdateDialog(): void {
		this._changelogService.getLatestChangelog().subscribe((changelog) => {
			const header = "Update Available";
			const message = changelog
				? this.buildChangelogMessage(changelog)
				: "A new version of the app is available. Would you like to load it?";

			this._confirmationService.confirm({
				header,
				message,
				accept: () => {
					this._swUpdate
						.activateUpdate()
						.then(() => document.location.reload());
				},
				acceptLabel: "Reload app",
				rejectLabel: "Dismiss",
			});
		});
	}

	private buildChangelogMessage(changelog: string): string {
		const formattedChangelog =
			this._changelogService.formatChangelogToHtml(changelog);

		return `
      <div class="changelog-content">
        <p><strong>This release includes:</strong></p>
        <ul>
          ${formattedChangelog}
        </ul>
      </div>
    `;
	}

	public ngOnInit(): void {
		App.addListener("appUrlOpen", ({ url }) => {
			this._ngZone.run(() => {
				if (
					url?.startsWith(
						`${config.appId}://${environment.auth0Domain}/capacitor/${config.appId}/callback`,
					) &&
					url.includes("state=") &&
					(url.includes("error=") || url.includes("code="))
				) {
					this._auth
						.handleRedirectCallback(url)
						.pipe(
							mergeMap(() => Browser.close()),
							catchError((err) => {
								console.log(err);
								return of(null);
							}),
						)
						.subscribe();
				} else {
					Browser.close();
				}
			});
		});

		this._auth.isAuthenticated$.subscribe((isAuthenticated) => {
			this.isLoggedIn.set(isAuthenticated);
		});

		environment.production &&
			this._auth.user$.subscribe((user) => {
				if (user) {
					LogRocket.identify(user.sub!, {
						name: user.name!,
						email: user.email!,
					});
				}
			});
	}
}
