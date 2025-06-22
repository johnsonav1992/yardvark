import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { getPoundsOfProductForDesiredN } from '../../../utils/lawnCalculatorUtils';
import { showAllFormErrorsOnSubmit } from '../../../utils/formUtils';

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

  public calculate(): void {
    if (this.form.invalid) return showAllFormErrorsOnSubmit(this.form);

    const { totalLawnSize, poundsOfN, nitrogenRate } = this.form.value;

    if (!totalLawnSize || !poundsOfN || !nitrogenRate)
      return showAllFormErrorsOnSubmit(this.form);

    const fertilizerAmount = getPoundsOfProductForDesiredN({
      desiredLbsOfNPer1000SqFt: poundsOfN,
      guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
      totalSquareFeet: totalLawnSize
    });

    console.log(`Fertilizer amount needed: ${fertilizerAmount} lbs`);
  }
}
