import { Component, DestroyRef, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../entry-dialog.component';

@Component({
  selector: 'entry-dialog-footer',
  imports: [ButtonModule],
  templateUrl: './entry-dialog-footer.component.html',
  styleUrl: './entry-dialog-footer.component.scss'
})
export class EntryDialogFooterComponent {
  private _destroyRef = inject(DestroyRef);
  private _dialogRef = inject(DynamicDialogRef<EntryDialogComponent>);
  private _dialogData = inject(DynamicDialogConfig).data;

  public form: InstanceType<typeof EntryDialogComponent>['form'] | null = null;

  constructor() {
    const compSub = this._dialogRef.onChildComponentLoaded.subscribe(
      (comp) => (this.form = comp.form)
    );

    this._destroyRef.onDestroy(() => compSub.unsubscribe());
  }

  public close(): void {
    console.log(this.form?.value);
    this._dialogRef.close();
  }
}
