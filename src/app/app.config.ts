import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideAuth0 } from '@auth0/auth0-angular';
import { theme } from './theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: theme,
        options: {
          darkModeSelector: false,
        },
      },
      ripple: true,
    }),
    provideAuth0({
      domain: 'dev-w4uj6ulyqeacwtfi.us.auth0.com',
      clientId: 'QRPi2KnSnV3pEnDiOqE2aN4zeNS8vRM5',
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    }),
  ],
};
