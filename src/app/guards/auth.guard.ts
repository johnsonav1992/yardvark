import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { inject } from '@angular/core';
import { first } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise<boolean>((resolve) => {
    authService.isAuthenticated$.pipe(first()).subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        resolve(true);
      } else {
        // need to figure out what to do here
        resolve(false);
      }
    });
  });
};
