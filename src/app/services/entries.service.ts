import { formatDate } from "@angular/common";
import { httpResource } from "@angular/common/http";
import { Injectable, inject, type Signal } from "@angular/core";
import { endOfMonth, startOfMonth } from "date-fns";
import {
	forkJoin,
	type Observable,
	type ObservableInput,
	of,
	switchMap,
} from "rxjs";
import type {
	BatchEntryCreationRequest,
	BatchEntryCreationResponse,
	EntriesSearchRequest,
	Entry,
	EntryCreationRequest,
	EntryCreationRequestFormInput,
} from "../types/entries.types";
import { apiUrl, deleteReq, postReq, putReq } from "../utils/httpUtils";
import { FilesService } from "./files.service";

@Injectable({
	providedIn: "root",
})
export class EntriesService {
	private _filesService = inject(FilesService);

	public getEntryResource = (
		shouldFetchEntry: Signal<boolean>,
		entryId: Signal<number | undefined>,
	) =>
		httpResource<Entry>(() =>
			shouldFetchEntry() && entryId()
				? apiUrl("entries/single", { params: [entryId()!] })
				: undefined,
		);

	public getEntryByDateResource = (date: Signal<Date | null>) =>
		httpResource<Entry>(() =>
			date()
				? apiUrl("entries/single/by-date", {
						params: [formatDate(date()!, "MM-dd-yyyy", "en-US")],
					})
				: undefined,
		);

	public recentEntry = httpResource<Entry | null>(() =>
		apiUrl("entries/single/most-recent"),
	);

	public lastMow = httpResource<{ lastMowDate: Date | null }>(() =>
		apiUrl("entries/last-mow"),
	);

	public lastProductApp = httpResource<{ lastProductAppDate: Date | null }>(
		() => apiUrl("entries/last-product-app"),
	);

	public getMonthEntriesResource = (currentDate: Signal<Date>) =>
		httpResource<Entry[]>(() =>
			apiUrl("entries", {
				queryParams: {
					startDate: startOfMonth(currentDate()).toISOString(),
					endDate: endOfMonth(currentDate()).toISOString(),
				},
			}),
		);

	public addEntry(req: EntryCreationRequestFormInput): Observable<void> {
		return (
			req.images?.length
				? this._filesService.uploadFiles(req.images).pipe(
						switchMap<string[], ObservableInput<EntryCreationRequest>>(
							(fileIds) =>
								of({
									...req,
									imageUrls: fileIds,
								}),
						),
					)
				: of({ ...req, imageUrls: [] })
		).pipe(
			switchMap((entry) =>
				postReq<void, EntryCreationRequest>(apiUrl("entries"), entry),
			),
		);
	}

	public addEntriesBatch(
		entries: EntryCreationRequestFormInput[],
	): Observable<BatchEntryCreationResponse> {
		const uploadObservables = entries.map((entry) =>
			entry.images?.length
				? this._filesService.uploadFiles(entry.images).pipe(
						switchMap<string[], ObservableInput<EntryCreationRequest>>(
							(fileIds) =>
								of({
									...entry,
									imageUrls: fileIds,
								}),
						),
					)
				: of({ ...entry, imageUrls: [] }),
		);

		return forkJoin(uploadObservables).pipe(
			switchMap((processedEntries) =>
				postReq<BatchEntryCreationResponse, BatchEntryCreationRequest>(
					apiUrl("entries/batch"),
					{ entries: processedEntries },
				),
			),
		);
	}

	public editEntry(
		entryId: number | undefined,
		updatedEntry: Partial<EntryCreationRequest>,
	): Observable<void> {
		if (!entryId) return of();

		return (
			updatedEntry.images?.length
				? this._filesService.uploadFiles(updatedEntry.images).pipe(
						switchMap<string[], ObservableInput<Partial<EntryCreationRequest>>>(
							(fileIds) =>
								of({
									...updatedEntry,
									imageUrls: [...(updatedEntry.imageUrls || []), ...fileIds],
								}),
						),
					)
				: of({ ...updatedEntry })
		).pipe(
			switchMap((entry) =>
				putReq<void, Partial<EntryCreationRequest>>(
					apiUrl("entries", { params: [entryId] }),
					entry,
				),
			),
		);
	}

	public deleteEntry(entryId: number): Observable<void> {
		return deleteReq(apiUrl("entries", { params: [entryId] }));
	}

	public searchEntries(
		searchCriteria: EntriesSearchRequest,
	): Observable<Entry[]> {
		return postReq<Entry[], EntriesSearchRequest>(
			apiUrl("entries/search"),
			searchCriteria,
		);
	}

	public deleteEntryImage(entryImageId: number): Observable<void> {
		return deleteReq(apiUrl("entries/entry-image", { params: [entryImageId] }));
	}
}
