import { CanActivateFn } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { inject } from '@angular/core';
import { first } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return new Promise<boolean>((resolve) => {
    authService.isAuthenticated$.pipe(first()).subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        resolve(true);
      } else {
        authService.loginWithRedirect();
        resolve(false);
      }
    });
  });
};
