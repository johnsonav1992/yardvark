import {
  ApplicationConfig,
  provideAppInitializer,
  provideExperimentalZonelessChangeDetection,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { mainRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideAuth0 } from '@auth0/auth0-angular';
import { theme } from './theme/theme';
import { MessageService } from 'primeng/api';
import { SlicePipe } from '@angular/common';
import { authInterceptor } from './interceptors/auth.interceptor';
import { initHttpUtils } from './utils/httpUtils';
import { YV_DARK_MODE_SELECTOR } from './constants/style-constants';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(mainRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
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
      domain: 'dev-w4uj6ulyqeacwtfi.us.auth0.com',
      clientId: 'QRPi2KnSnV3pEnDiOqE2aN4zeNS8vRM5',
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    }),
    provideAppInitializer(() => initHttpUtils()),
    MessageService,
    SlicePipe
  ]
};
