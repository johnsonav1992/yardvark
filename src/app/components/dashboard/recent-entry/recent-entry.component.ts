import { CdkDragHandle } from "@angular/cdk/drag-drop";
import { DatePipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, output } from "@angular/core";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import { EntriesService } from "../../../services/entries.service";
import { GlobalUiService } from "../../../services/global-ui.service";
import { ProductSmallCardComponent } from "../../products/product-small-card/product-small-card.component";

@Component({
	selector: "recent-entry",
	imports: [
		CardModule,
		ProductSmallCardComponent,
		DatePipe,
		NgTemplateOutlet,
		ButtonModule,
		TooltipModule,
		CdkDragHandle,
	],
	templateUrl: "./recent-entry.component.html",
	styleUrl: "./recent-entry.component.scss",
})
export class RecentEntryComponent {
	private _router = inject(Router);
	private _entriesService = inject(EntriesService);
	private _globalUiService = inject(GlobalUiService);

	public isMobile = this._globalUiService.isMobile;

	public recentEntry = computed(
		() => this._entriesService.dashboardSummary.value()?.recentEntry ?? null,
	);
	public isLoading = this._entriesService.dashboardSummary.isLoading;

	public onHideWidget = output<void>();

	public goToEntry(): void {
		this._router.navigate(["entry-log", this.recentEntry()?.id]);
	}

	public navToEntryCreation(): void {
		this._router.navigate(["entry-log"], { queryParams: { create: true } });
	}

	public hideWidget(): void {
		this.onHideWidget.emit();
	}
}
