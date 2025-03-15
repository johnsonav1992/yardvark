import { Component, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'entry-dialog',
  imports: [
    DatePickerModule,
    MultiSelectModule,
    TextareaModule,
    ReactiveFormsModule
  ],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.scss'
})
export class EntryDialogComponent {
  private _dialogData = inject(DynamicDialogConfig).data;

  public form = new FormGroup({
    date: new FormControl(new Date())
  });

  something = input();
}
