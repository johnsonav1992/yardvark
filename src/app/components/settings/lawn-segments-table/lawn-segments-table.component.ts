import {
  Component,
  effect,
  inject,
  model,
  OnDestroy,
  output,
  signal,
  viewChild
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { DataTableDesignTokens } from '@primeuix/themes/types/datatable';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { injectErrorToast } from '../../../utils/toastUtils';
import { CardModule } from 'primeng/card';
import { LoadingSpinnerComponent } from '../../miscellanious/loading-spinner/loading-spinner.component';
import { DEFAULT_LAWN_SEGMENT_COLOR } from '../../../constants/lawn-segment-constants';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'lawn-segments-table',
  imports: [
    TableModule,
    ButtonModule,
    FormsModule,
    InputTextModule,
    CardModule,
    LoadingSpinnerComponent,
    TooltipModule
  ],
  templateUrl: './lawn-segments-table.component.html',
  styleUrl: './lawn-segments-table.component.scss'
})
export class LawnSegmentsTableComponent implements OnDestroy {
  private _lawnSegmentsService = inject(LawnSegmentsService);
  private _throwErrorToast = injectErrorToast();

  public lawnSegments = model.required<LawnSegment[] | undefined>();
  public hasUnsavedChanges = model.required<boolean>();
  public currentlyEditingLawnSegmentIds = signal<number[] | null>(null);
  public editOnMapClicked = output<LawnSegment>();
  public segmentSaveClicked = output<LawnSegment>();
  public segmentEditCanceled = output<LawnSegment>();

  public lawnSegmentTable = viewChild(Table);

  public lawnSegmentsAreLoading =
    this._lawnSegmentsService.lawnSegments.isLoading;

  _unsavedChangesListener = effect(() => {
    this.hasUnsavedChanges.set(!!this.currentlyEditingLawnSegmentIds()?.length);
  });

  public ngOnDestroy(): void {
    this._lawnSegmentsService.lawnSegments.reload();
  }

  public editLawnSegment(segment: LawnSegment): void {
    this.currentlyEditingLawnSegmentIds.update((prev) => {
      return prev ? [...prev, segment.id] : [segment.id];
    });

    // Trigger map editing/drawing mode
    this.editOnMapClicked.emit(segment);
  }

  public addLawnSegmentRow(): void {
    const newId = Math.random();
    const newRow = {
      id: newId,
      name: '',
      area: 0,
      userId: '',
      size: 0, // Will be set when mapped
      color: DEFAULT_LAWN_SEGMENT_COLOR,
      coordinates: null
    };

    this.lawnSegments.update((prev) => {
      return [...prev!, newRow];
    });

    this.currentlyEditingLawnSegmentIds.update((prev) => {
      return prev ? [...prev, newId] : [newId];
    });

    this.lawnSegmentTable()?.initRowEdit(newRow);
  }

  public onRowSave(segment: LawnSegment): void {
    const isNewSegment = segment.id < 1;

    // Emit event so parent can add map edits to the segment
    this.segmentSaveClicked.emit(segment);

    this._lawnSegmentsService[
      isNewSegment ? 'addLawnSegment' : 'updateLawnSegment'
    ](segment).subscribe({
      next: (newSeg) => {
        this.removeSegmentFromEditingList(segment.id);

        this.lawnSegments.update((prev) => {
          return prev?.map((seg) =>
            seg.name.toLowerCase() === newSeg.name.toLowerCase() ? newSeg : seg
          );
        });
      },
      error: () => {
        this._throwErrorToast('Error saving lawn segment');

        if (isNewSegment) {
          this.lawnSegments.update((prev) => {
            return prev?.filter((seg) => seg.id !== segment.id);
          });
        }

        this.currentlyEditingLawnSegmentIds.set(null);
      }
    });
  }

  public deleteSegment(segmentId: number): void {
    this._lawnSegmentsService.deleteLawnSegment(segmentId).subscribe({
      next: () => {
        this._lawnSegmentsService.lawnSegments.reload();
      },
      error: () => {
        this._throwErrorToast('Error deleting lawn segment');
      }
    });
  }

  public cancelRowEdit(segment: LawnSegment, emitEvent = true): void {
    const isNewSegment = segment.id < 1;

    if (isNewSegment) {
      this.lawnSegments.update((prev) => {
        return prev?.filter((seg) => seg.id !== segment.id);
      });
    }

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

  public lawnSegsTableDt: DataTableDesignTokens = {
    bodyCell: { padding: '.25rem' },
    headerCell: { padding: '.25rem' }
  };
}
