import { Component, inject, model, signal } from "@angular/core";
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { format } from "date-fns";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { DrawerModule } from "primeng/drawer";
import { MessageModule } from "primeng/message";
import { CsvExportService } from "../../../services/csv-export.service";
import { EntriesService } from "../../../services/entries.service";
import { GlobalUiService } from "../../../services/global-ui.service";
import type { EntriesSearchRequest, Entry } from "../../../types/entries.types";
import { getEntryCsvConfig } from "../../../utils/csvUtils";
import { LoadingSpinnerComponent } from "../../miscellanious/loading-spinner/loading-spinner.component";

@Component({
	selector: "csv-export-sidebar",
	imports: [
		DrawerModule,
		ButtonModule,
		DatePickerModule,
		MessageModule,
		ReactiveFormsModule,
		LoadingSpinnerComponent,
	],
	templateUrl: "./csv-export-sidebar.component.html",
	styleUrl: "./csv-export-sidebar.component.scss",
})
export class CsvExportSidebarComponent {
	private _entriesService = inject(EntriesService);
	private _csvExportService = inject(CsvExportService);
	private _globalUiService = inject(GlobalUiService);

	public isOpen = model(false);
	public isMobile = this._globalUiService.isMobile;

	public isLoading = signal(false);
	public searchResults = signal<Entry[] | null>(null);
	public errorMessage = signal<string | null>(null);

	public form = new FormGroup({
		dates: new FormControl<Date[]>([], Validators.required),
	});

	public onCloseSidebar(): void {
		this.isOpen.set(false);
		this.resetForm();
	}

	private resetForm(): void {
		this.form.reset();
		this.searchResults.set(null);
		this.errorMessage.set(null);
		this.isLoading.set(false);
	}

	public searchEntries(): void {
		if (this.form.invalid) return;

		const dates = this.form.value.dates;

		if (!dates || dates.length !== 2 || !dates[0] || !dates[1]) {
			this.errorMessage.set("Please select a valid date range");
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set(null);

		const searchCriteria: EntriesSearchRequest = {
			dateRange: dates
				.filter((date) => date != null)
				.map((date) => date.toISOString()),
			titleOrNotes: "",
			activities: [],
			lawnSegments: [],
			products: [],
		};

		this._entriesService.searchEntries(searchCriteria).subscribe({
			next: (entries) => {
				this.isLoading.set(false);
				this.searchResults.set(entries);
			},
			error: () => {
				this.isLoading.set(false);
				this.errorMessage.set("Error searching entries. Please try again.");
			},
		});
	}

	public exportCsv(): void {
		const results = this.searchResults();
		if (!results || results.length === 0) return;

		const dates = this.form.value.dates;
		if (!dates || dates.length !== 2 || !dates[0] || !dates[1]) return;

		const startDate = format(dates[0], "MM-dd-yyyy");
		const endDate = format(dates[1], "MM-dd-yyyy");
		const filename = `yard-entries-${startDate}-to-${endDate}.csv`;

		const sortedResults = [...results].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		const config = getEntryCsvConfig(filename);
		this._csvExportService.exportToCsv(sortedResults, config);

		this.onCloseSidebar();
	}

	public get canExport(): boolean {
		const results = this.searchResults();

		return results !== null && results.length > 0 && !this.isLoading();
	}

	public get canSearch(): boolean {
		return this.form.valid && !this.isLoading();
	}
}
