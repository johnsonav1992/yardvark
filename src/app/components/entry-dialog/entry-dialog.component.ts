import { Component, input } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'entry-dialog',
  imports: [DatePickerModule, MultiSelectModule, TextareaModule],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.scss'
})
export class EntryDialogComponent {
  something = input();
}
