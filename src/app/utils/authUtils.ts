import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';

/**
 * Retrieves the user data from the authentication service and stores it in a signal.
 *
 * @returns A signal representing the user data.
 */
export const injectUserData = () => {
  const authService = inject(AuthService);

  return toSignal(authService.user$);
};
