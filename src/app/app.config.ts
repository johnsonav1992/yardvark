import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  isDevMode
} from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions
} from '@angular/router';

import { mainRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';
import { theme } from './theme/theme';
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideHttpUtils } from './utils/httpUtils';
import { YV_DARK_MODE_SELECTOR } from './constants/style-constants';
import { environment } from '../environments/environment';
import { provideServiceWorker } from '@angular/service-worker';
import { getRedirectUri } from './utils/authUtils';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      mainRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top'
      }),
      withViewTransitions({ skipInitialTransition: true })
    ),
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    providePrimeNG({
      theme: {
        preset: theme,
        options: {
          darkModeSelector: `.${YV_DARK_MODE_SELECTOR}`
        }
      },
      ripple: true
    }),
    provideAuth0({
      domain: environment.auth0Domain,
      clientId: environment.auth0ClientId,
      authorizationParams: {
        redirect_uri: getRedirectUri(),
        audience: `https://${environment.auth0Domain}/api/v2/`
      },
      useRefreshTokens: true,
      useRefreshTokensFallback: false,
      httpInterceptor: {
        allowedList: [
          {
            uri: environment.apiUrl + '/*',
            tokenOptions: {
              authorizationParams: {
                audience: `https://${environment.auth0Domain}/api/v2/`
              }
            }
          }
        ]
      }
    }),
    provideHttpUtils(),
    MessageService,
    ConfirmationService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
