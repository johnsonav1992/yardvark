import { Component, input } from '@angular/core';

@Component({
  selector: 'entry-dialog',
  imports: [],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.scss'
})
export class EntryDialogComponent {
  something = input();
}
