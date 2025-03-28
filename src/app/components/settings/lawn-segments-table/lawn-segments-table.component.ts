import { Component, inject, model, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { DataTableDesignTokens } from '@primeng/themes/types/datatable';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { injectErrorToast } from '../../../utils/toastUtils';

@Component({
  selector: 'lawn-segments-table',
  imports: [TableModule, ButtonModule, FormsModule, InputTextModule],
  templateUrl: './lawn-segments-table.component.html',
  styleUrl: './lawn-segments-table.component.scss'
})
export class LawnSegmentsTableComponent {
  private _lawnSegmentsService = inject(LawnSegmentsService);
  private _throwErrorToast = injectErrorToast();

  public lawnSegments = model.required<LawnSegment[] | undefined>();
  public currentlyEditingLawnSegmentId = model.required<number | null>();

  public lawnSegmentTable = viewChild(Table);

  public editLawnSegment(segment: LawnSegment): void {
    this.currentlyEditingLawnSegmentId.set(segment.id);
  }

  public addLawnSegmentRow(): void {
    const newId = Math.random();
    const newRow = { id: newId, name: '', area: 0, userId: '', size: 0 };

    this.lawnSegments.update((prev) => {
      return [...prev!, newRow];
    });

    this.currentlyEditingLawnSegmentId.set(newId);
    this.lawnSegmentTable()?.initRowEdit(newRow);
  }

  public onRowSave(segment: LawnSegment): void {
    this._lawnSegmentsService.addLawnSegment(segment).subscribe({
      next: () => {
        this._lawnSegmentsService.lawnSegments.reload();
        this.currentlyEditingLawnSegmentId.set(null);
      },
      error: () => {
        this._throwErrorToast('Error saving lawn segment');

        this.lawnSegments.update((prev) => {
          return prev?.filter((seg) => seg.id !== segment.id);
        });
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

  public lawnSegsTableDt: DataTableDesignTokens = {
    bodyCell: { padding: '.25rem' },
    headerCell: { padding: '.25rem' }
  };
}
