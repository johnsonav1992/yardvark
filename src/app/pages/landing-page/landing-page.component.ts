import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "@auth0/auth0-angular";
import { Button } from "primeng/button";
import { VarkyLogoComponent } from "../../components/miscellanious/varky-logo/varky-logo.component";

@Component({
	selector: "landing-page",
	standalone: true,
	imports: [Button, RouterLink, VarkyLogoComponent],
	templateUrl: "./landing-page.component.html",
	styleUrl: "./landing-page.component.scss",
})
export class LandingPageComponent {
	private _auth = inject(AuthService);

	public currentYear = new Date().getFullYear();

	public signIn(): void {
		this._auth.loginWithRedirect();
	}

	public signUp(): void {
		this._auth.loginWithRedirect({ authorizationParams: { screen_hint: "signup" } });
	}
}
