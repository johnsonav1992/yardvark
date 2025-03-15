import { Component, computed, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ActivitiesService } from '../../services/activities.service';
import { capitalize } from '../../utils/stringUtils';
import { Activity } from '../../types/activities.types';
import { LawnSegment } from '../../types/lawnSegments.types';
import { LawnSegmentsService } from '../../services/lawn-segments.service';

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
  public lawnSegmentsResource = inject(LawnSegmentsService).lawnSegments;

  public activities = computed(() =>
    this.activitiesResource
      .value()
      ?.map((act) => ({ ...act, name: capitalize(act.name) }))
  );

  public lawnSegments = computed(() => this.lawnSegmentsResource.value());

  public form = new FormGroup({
    date: new FormControl(new Date(), [Validators.required]),
    activities: new FormControl<Activity[]>([]),
    lawnSegments: new FormControl<LawnSegment[]>([]),
    notes: new FormControl<string | null>(null)
  });
}
