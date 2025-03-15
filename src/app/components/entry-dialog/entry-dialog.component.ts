import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ActivitiesService } from '../../services/activities.service';
import { capitalize } from '../../utils/stringUtils';

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
  private _activitiesService = inject(ActivitiesService);

  public activitiesResource = this._activitiesService.activities;
  public activities = computed(() =>
    this.activitiesResource
      .value()
      ?.map((act) => ({ ...act, name: capitalize(act.name) }))
  );

  public form = new FormGroup({
    date: new FormControl(new Date())
  });
}
