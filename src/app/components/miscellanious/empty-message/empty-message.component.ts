import { Component, input } from "@angular/core";

@Component({
	selector: "empty-message",
	imports: [],
	templateUrl: "./empty-message.component.html",
	styleUrl: "./empty-message.component.scss",
})
export class EmptyMessageComponent {
	public message = input.required<string>();
	public description = input<string>();
	public icon = input<string>("ti ti-database-off");
	public size = input<"sm" | "md" | "lg">("md");
}
