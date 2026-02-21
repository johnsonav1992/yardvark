import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { of } from 'rxjs';
import { first, mergeMap } from 'rxjs/operators';

export const hybridAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    first(),
    mergeMap((isAuthenticated) => {
      if (isAuthenticated) {
        return of(true);
      } else {
        if (Capacitor.isNativePlatform()) {
          authService.loginWithRedirect({
            openUrl: async (url) => {
              await Browser.open({ url, windowName: '_self' });
            }
          });
        } else {
          authService.loginWithRedirect();
        }

        return authService.isAuthenticated$.pipe(
          first((isAuthenticated) => isAuthenticated),
          mergeMap((isAuthenticated) => of(isAuthenticated))
        );
      }
    })
  );
};
