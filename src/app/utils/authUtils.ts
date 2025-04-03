import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';

/**
 * Retrieves the user data from the authentication service and stores it in a signal.
 *
 * @returns A signal representing the user data.
 */
export const injectUserData = () => {
  const authService = inject(AuthService);

  return toSignal(authService.user$);
};

export const isMasterUser = (user: User | null | undefined): boolean => {
  return user?.email === 'johnsonav1992@gmail.com';
};
