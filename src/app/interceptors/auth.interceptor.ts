import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn
} from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { catchError, switchMap, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { ConfirmationService } from 'primeng/api';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const confirmationService = inject(ConfirmationService);

  return auth.idTokenClaims$.pipe(
    take(1),
    switchMap((token) => {
      if (token) {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token.__raw}`
          }
        });

        return next(cloned);
      }

      return next(req);
    }),
    catchError(() => {
      confirmationService.confirm({
        header: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        accept: () => {
          auth.loginWithRedirect();
        },
        reject: () => {
          console.log('User chose not to log in.');
        }
      });

      return of();
    })
  );
};
