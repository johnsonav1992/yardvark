import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';

export const CUSTOM_CLAIM_BASE = 'https://www.yardvark.com';
export const ROLES_CLAIM = `${CUSTOM_CLAIM_BASE}/roles`;

export const MASTER_USER = 'Master User';

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
  return user?.[ROLES_CLAIM].includes(MASTER_USER);
};

export const getUserInitials = (user: User | null | undefined): string => {
  if (!user?.name) return '';

  const nameParts = user.name.split(' ');

  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  } else {
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  }
};
