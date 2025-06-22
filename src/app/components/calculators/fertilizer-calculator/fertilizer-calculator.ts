import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'fertilizer-calculator',
  imports: [],
  templateUrl: './fertilizer-calculator.html',
  styleUrl: './fertilizer-calculator.scss'
})
export class FertilizerCalculator {
  public form = new FormGroup({
    totalLawnSize: new FormControl<number | null>(null),
    poundsOfN: new FormControl<number | null>(null),
    nitrogenRate: new FormControl<number | null>(null),
    phosphorusRate: new FormControl<number | null>(null),
    potassiumRate: new FormControl<number | null>(null)
  });
}
