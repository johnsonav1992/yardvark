import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProductSmallCardComponent } from '../../products/product-small-card/product-small-card.component';
import { EntriesService } from '../../../services/entries.service';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { GlobalUiService } from '../../../services/global-ui.service';

@Component({
	selector: 'recent-entry',
	imports: [
		CardModule,
		ProductSmallCardComponent,
		DatePipe,
		NgTemplateOutlet,
		ButtonModule,
	],
	templateUrl: './recent-entry.component.html',
	styleUrl: './recent-entry.component.scss',
})
export class RecentEntryComponent {
	private _router = inject(Router);
	private _entriesService = inject(EntriesService);
	private _globalUiService = inject(GlobalUiService);

	public isMobile = this._globalUiService.isMobile;

	public recentEntry = this._entriesService.recentEntry;

	public goToEntry(): void {
		this._router.navigate(['entry-log', this.recentEntry.value()?.id]);
	}

	public navToEntryCreation(): void {
		this._router.navigate(['entry-log'], { queryParams: { create: true } });
	}
}
