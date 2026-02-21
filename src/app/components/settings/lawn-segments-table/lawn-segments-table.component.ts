import { DecimalPipe } from "@angular/common";
import {
	Component,
	computed,
	effect,
	inject,
	input,
	model,
	output,
	signal,
	viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { DataTableDesignTokens } from "@primeuix/themes/types/datatable";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { Table, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { DEFAULT_LAWN_SEGMENT_COLOR } from "../../../constants/lawn-segment-constants";
import { LawnSegmentsService } from "../../../services/lawn-segments.service";
import type { LawnSegment } from "../../../types/lawnSegments.types";
import { injectErrorToast } from "../../../utils/toastUtils";

@Component({
	selector: "lawn-segments-table",
	imports: [
		TableModule,
		ButtonModule,
		FormsModule,
		InputTextModule,
		InputNumberModule,
		CardModule,
		TooltipModule,
		DecimalPipe,
		SkeletonModule,
	],
	templateUrl: "./lawn-segments-table.component.html",
	styleUrl: "./lawn-segments-table.component.scss",
})
export class LawnSegmentsTableComponent {
	private _lawnSegmentsService = inject(LawnSegmentsService);
	private _throwErrorToast = injectErrorToast();

	public lawnSegments = model.required<LawnSegment[] | undefined>();
	public hasUnsavedChanges = model.required<boolean>();
	public isMobile = input<boolean>(false);
	public currentlyEditingLawnSegmentIds = signal<number[] | null>(null);
	public editOnMapClicked = output<LawnSegment>();
	public segmentSaveClicked = output<LawnSegment>();
	public segmentEditCanceled = output<LawnSegment>();
	public segmentNameChanged = output<LawnSegment>();

	private _originalSegmentNames = new Map<number, string>();

	public onSegmentNameChange(segment: LawnSegment): void {
		this.segmentNameChanged.emit(segment);
	}

	public lawnSegmentTable = viewChild(Table);
	public lawnSegmentsAreLoading =
		this._lawnSegmentsService.lawnSegments.isLoading;

	public lawnSegsTableDt: DataTableDesignTokens = {
		bodyCell: { padding: ".25rem" },
		headerCell: { padding: ".25rem" },
	};

	public totalLawnSize = computed(() => {
		const segments = this.lawnSegments();

		if (!segments?.length) return 0;

		return segments.reduce((sum, seg) => sum + (+seg.size || 0), 0);
	});

	_unsavedChangesListener = effect(() => {
		this.hasUnsavedChanges.set(!!this.currentlyEditingLawnSegmentIds()?.length);
	});

	public editLawnSegment(segment: LawnSegment): void {
		this._originalSegmentNames.set(segment.id, segment.name);

		this.currentlyEditingLawnSegmentIds.update((prev) =>
			prev ? [...prev, segment.id] : [segment.id],
		);

		this.editOnMapClicked.emit(segment);
	}

	public addLawnSegmentRow(): void {
		const newId = Math.random();
		const newRow: LawnSegment = {
			id: newId,
			name: "",
			userId: "",
			size: 0,
			color: DEFAULT_LAWN_SEGMENT_COLOR,
			coordinates: null,
		};

		this.lawnSegments.update((prev) => [...prev!, newRow]);
		this.currentlyEditingLawnSegmentIds.update((prev) =>
			prev ? [...prev, newId] : [newId],
		);
		this.lawnSegmentTable()?.initRowEdit(newRow);

		this.editOnMapClicked.emit(newRow);
	}

	public onRowSave(segment: LawnSegment): void {
		const isNewSegment = segment.id < 1;
		this.segmentSaveClicked.emit(segment);

		const tableSegment = this.lawnSegments()?.find((s) => s.id === segment.id);

		const saveMethod = isNewSegment ? "addLawnSegment" : "updateLawnSegment";
		this._lawnSegmentsService[saveMethod](segment).subscribe({
			next: (newSeg) => {
				this._originalSegmentNames.delete(segment.id);
				this.removeSegmentFromEditingList(segment.id);

				if (tableSegment) {
					this.lawnSegmentTable()?.cancelRowEdit(tableSegment);
				}

				this.lawnSegments.update((prev) =>
					prev?.map((seg) =>
						seg.name.toLowerCase() === newSeg.name.toLowerCase() ? newSeg : seg,
					),
				);
			},
			error: () => {
				this._throwErrorToast("Error saving lawn segment");

				if (isNewSegment) {
					this.lawnSegments.update((prev) =>
						prev?.filter((seg) => seg.id !== segment.id),
					);
				}

				this.currentlyEditingLawnSegmentIds.set(null);
			},
		});
	}

	public deleteSegment(segmentId: number): void {
		this._lawnSegmentsService.deleteLawnSegment(segmentId).subscribe({
			next: () => {
				this._lawnSegmentsService.lawnSegments.update((segments) =>
					segments?.filter((seg) => seg.id !== segmentId),
				);
			},
			error: () => this._throwErrorToast("Error deleting lawn segment"),
		});
	}

	public cancelRowEdit(segment: LawnSegment, emitEvent = true): void {
		if (segment.id < 1) {
			this.lawnSegments.update((prev) =>
				prev?.filter((seg) => seg.id !== segment.id),
			);
		} else {
			const originalName = this._originalSegmentNames.get(segment.id);

			if (originalName !== undefined) {
				this.lawnSegments.update((prev) =>
					prev?.map((seg) =>
						seg.id === segment.id ? { ...seg, name: originalName } : seg,
					),
				);
			}
		}

		this._originalSegmentNames.delete(segment.id);
		this.removeSegmentFromEditingList(segment.id);

		if (emitEvent) {
			this.segmentEditCanceled.emit(segment);
		}
	}

	private removeSegmentFromEditingList(segmentId: number): void {
		this.currentlyEditingLawnSegmentIds.update((prev) => {
			const filtered = prev?.filter((id) => id !== segmentId);
			return filtered?.length ? filtered : null;
		});
	}
}
