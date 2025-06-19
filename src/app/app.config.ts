import {
  ApplicationConfig,
  provideAppInitializer,
  provideZonelessChangeDetection,
  isDevMode
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { mainRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';
import { theme } from './theme/theme';
import { ConfirmationService, MessageService } from 'primeng/api';
import { initHttpUtils } from './utils/httpUtils';
import { YV_DARK_MODE_SELECTOR } from './constants/style-constants';
import { environment } from '../environments/environment';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(mainRoutes),
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    provideAnimationsAsync(),
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
        redirect_uri: window.location.origin,
        audience: `https://${environment.auth0Domain}/api/v2/`
      },
      useRefreshTokens: true,
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
    provideAppInitializer(() => initHttpUtils()),
    MessageService,
    ConfirmationService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
