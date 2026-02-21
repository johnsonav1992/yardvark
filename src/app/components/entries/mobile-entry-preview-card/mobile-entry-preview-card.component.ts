import { DatePipe } from "@angular/common";
import { Component, inject, input } from "@angular/core";
import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import type { Entry } from "../../../types/entries.types";

@Component({
	selector: "mobile-entry-preview-card",
	imports: [CardModule, DatePipe],
	templateUrl: "./mobile-entry-preview-card.component.html",
	styleUrl: "./mobile-entry-preview-card.component.scss",
})
export class MobileEntryPreviewCardComponent {
	private _router = inject(Router);

	public entry = input.required<Entry>();

	public navigateToEntry(entry: Entry): void {
		this._router.navigate(["entry-log", entry.id], {
			queryParams: { date: new Date(entry.date).toISOString() },
		});
	}
}
