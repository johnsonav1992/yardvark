import { Component, input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { showAllFormErrorsOnSubmit } from '../../../utils/formUtils';

@Component({
  selector: 'equipment-maintenance-add-edit-modal',
  imports: [
    InputTextModule,
    FloatLabelModule,
    InputIconModule,
    IconFieldModule,
    DatePickerModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './equipment-maintenance-add-edit-modal.component.html',
  styleUrl: './equipment-maintenance-add-edit-modal.component.scss'
})
export class EquipmentMaintenanceAddEditModalComponent implements OnInit {
  public date = input<Date>();
  public notes = input<string>();
  public cost = input<number>();

  public form = new FormGroup({
    date: new FormControl<Date | null>(null, [Validators.required]),
    cost: new FormControl<number | null>(null),
    notes: new FormControl('', [Validators.required])
  });

  public ngOnInit(): void {
    this.form.patchValue({
      date: this.date(),
      notes: this.notes(),
      cost: this.cost()
    });
  }

  public submit(): void {
    if (this.form.invalid) {
      return showAllFormErrorsOnSubmit(this.form);
    }

    console.log(this.form.value);
  }
}
