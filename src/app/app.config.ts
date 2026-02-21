import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
	type ApplicationConfig,
	isDevMode,
	provideZonelessChangeDetection,
} from "@angular/core";
import {
	provideRouter,
	withInMemoryScrolling,
	withViewTransitions,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { authHttpInterceptorFn, provideAuth0 } from "@auth0/auth0-angular";
import { ConfirmationService, MessageService } from "primeng/api";
import { providePrimeNG } from "primeng/config";
import { environment } from "../environments/environment";
import { mainRoutes } from "./app.routes";
import { CustomAuth0Cache } from "./config/auth0Cache.config";
import { YV_DARK_MODE_SELECTOR } from "./constants/style-constants";
import { theme } from "./theme/theme";
import { getRedirectUri } from "./utils/authUtils";
import { provideHttpUtils } from "./utils/httpUtils";

export const appConfig: ApplicationConfig = {
	providers: [
		provideZonelessChangeDetection(),
		provideRouter(
			mainRoutes,
			withInMemoryScrolling({
				scrollPositionRestoration: "top",
			}),
			withViewTransitions({ skipInitialTransition: true }),
		),
		provideHttpClient(withInterceptors([authHttpInterceptorFn])),
		providePrimeNG({
			theme: {
				preset: theme,
				options: {
					darkModeSelector: `.${YV_DARK_MODE_SELECTOR}`,
				},
			},
			ripple: true,
		}),
		provideAuth0({
			domain: environment.auth0Domain,
			clientId: environment.auth0ClientId,
			authorizationParams: {
				redirect_uri: getRedirectUri(),
				audience: `https://${environment.auth0Domain}/api/v2/`,
			},
			cache: new CustomAuth0Cache(),
			useRefreshTokens: true,
			useRefreshTokensFallback: false,
			httpInterceptor: {
				allowedList: [
					{
						uri: `${environment.apiUrl}/*`,
						tokenOptions: {
							authorizationParams: {
								audience: `https://${environment.auth0Domain}/api/v2/`,
							},
						},
					},
				],
			},
		}),
		provideHttpUtils(),
		MessageService,
		ConfirmationService,
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000",
		}),
	],
};
