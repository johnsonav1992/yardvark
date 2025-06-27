import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import {
  getNitrogenRateFromFields,
  getPoundsOfNInFertilizerApp,
  getPoundsOfProductForDesiredN
} from '../../../utils/lawnCalculatorUtils';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'fertilizer-calculator',
  imports: [ReactiveFormsModule, InputTextModule, InputNumberModule],
  templateUrl: './fertilizer-calculator.html',
  styleUrl: './fertilizer-calculator.scss'
})
export class FertilizerCalculator {
  public fertilizerForm = new FormGroup({
    totalLawnSize: new FormControl<number | null>(null),
    nitrogenRate: new FormControl<number | null>(null),
    poundsOfN: new FormControl<number | null>(null),
    fertilizerAmount: new FormControl<number | null>(null)
  });

  public constructor() {
    for (const controlName in this.fertilizerForm.controls) {
      const control = this.fertilizerForm.get(controlName);
      control?.valueChanges.subscribe((value) => {
        this.calculate(controlName, value);
      });
    }
  }

  public calculate(formControlName: string, value: number | null): void {
    const { totalLawnSize, nitrogenRate, poundsOfN, fertilizerAmount } =
      this.fertilizerForm.value;

    console.log(formControlName);
    this.fertilizerForm.patchValue(
      {
        poundsOfN:
          formControlName !== 'poundsOfN'
            ? getPoundsOfNInFertilizerApp({
                guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
                poundsOfProduct: fertilizerAmount || 0,
                totalSquareFeet: totalLawnSize || 0
              })
            : value || undefined,
        fertilizerAmount:
          formControlName !== 'fertilizerAmount'
            ? getPoundsOfProductForDesiredN({
                totalSquareFeet: totalLawnSize || 0,
                desiredLbsOfNPer1000SqFt: poundsOfN || 0,
                guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`
              })
            : value || undefined,
        nitrogenRate:
          formControlName !== 'nitrogenRate'
            ? getNitrogenRateFromFields({
                totalLawnSize: totalLawnSize || 0,
                poundsOfN: poundsOfN || 0,
                fertilizerAmount: fertilizerAmount || 0
              })
            : value || undefined,
        totalLawnSize:
          formControlName !== 'totalLawnSize'
            ? totalLawnSize
            : totalLawnSize || undefined
      },
      { emitEvent: false }
    );
  }
}
