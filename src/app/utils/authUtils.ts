import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { MASTER_USER, ROLES_CLAIM } from '../constants/auth-constants';
import { Maybe } from '../types/utils.types';
import { YVUser } from '../types/user.types';

/**
 * Retrieves the user data from the authentication service and stores it in a signal.
 *
 * @returns A signal representing the user data.
 */
export const injectUserData = () => {
	const authService = inject(AuthService);

	return toSignal(authService.user$);
};

export const isMasterUser = (user: Maybe<YVUser>): boolean => {
	return user?.[ROLES_CLAIM].includes(MASTER_USER) || false;
};

export const getUserInitials = (user: Maybe<YVUser>): string => {
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
