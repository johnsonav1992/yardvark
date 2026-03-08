import { Component, input } from "@angular/core";

@Component({
	selector: "varky-logo",
	imports: [],
	templateUrl: "./varky-logo.component.html",
	styleUrl: "./varky-logo.component.scss",
	host: {
		"[style.width]": "size()",
		"[style.height]": "size()",
	},
})
export class VarkyLogoComponent {
	public color = input<string>("currentColor");
	public size = input<string | undefined>(undefined);
}
