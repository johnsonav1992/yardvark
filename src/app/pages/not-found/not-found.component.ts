import { Location } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Button } from "primeng/button";

@Component({
	selector: "not-found",
	imports: [Button],
	templateUrl: "./not-found.component.html",
	styleUrl: "./not-found.component.scss",
})
export class NotFoundComponent {
	private readonly location = inject(Location);
	private readonly router = inject(Router);

	protected goBack(): void {
		this.location.back();
	}

	protected goHome(): void {
		this.router.navigate(["/dashboard"]);
	}
}
