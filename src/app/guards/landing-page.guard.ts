import { inject } from "@angular/core";
import { Router } from "@angular/router";
import type { CanActivateFn } from "@angular/router";
import { AuthService } from "@auth0/auth0-angular";
import { first, map } from "rxjs/operators";

export const landingPageGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);

	return auth.isAuthenticated$.pipe(
		first(),
		map((isAuthenticated) => {
			if (isAuthenticated) {
				return router.createUrlTree(["/dashboard"]);
			}

			if (localStorage.getItem("yv_has_account")) {
				auth.loginWithRedirect();

				return false;
			}

			return true;
		}),
	);
};
