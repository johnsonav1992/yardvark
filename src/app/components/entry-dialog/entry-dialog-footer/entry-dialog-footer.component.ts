import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'entry-dialog-footer',
  imports: [ButtonModule],
  templateUrl: './entry-dialog-footer.component.html',
  styleUrl: './entry-dialog-footer.component.scss'
})
export class EntryDialogFooterComponent {
  private _dialogRef = inject(DynamicDialogRef);

  public close(): void {
    this._dialogRef.close();
  }
}
