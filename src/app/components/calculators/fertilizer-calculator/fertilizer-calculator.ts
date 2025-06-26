import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  getPoundsOfNInFertilizerApp,
  getPoundsOfProductForDesiredN
} from '../../../utils/lawnCalculatorUtils';
import { InputNumberModule } from 'primeng/inputnumber';
import { pairwise, startWith } from 'rxjs';

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
    this.fertilizerForm.valueChanges
      .pipe(
        takeUntilDestroyed(),
        startWith(this.fertilizerForm.value),
        pairwise()
      )
      .subscribe(([prev, curr]) => this.calculate(prev, curr));
  }

  public calculate(
    prevFormVal: typeof this.fertilizerForm.value,
    currFormVal: typeof this.fertilizerForm.value
  ): void {
    const { totalLawnSize, nitrogenRate, poundsOfN, fertilizerAmount } =
      currFormVal;

    const [changedField] = Object.entries(currFormVal)
      .filter(
        ([key, value]) =>
          value !== prevFormVal[key as keyof typeof this.fertilizerForm.value]
      )
      .map(([key]) => key);

    this.fertilizerForm.patchValue(
      {
        poundsOfN:
          changedField !== 'poundsOfN'
            ? getPoundsOfNInFertilizerApp({
                guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
                poundsOfProduct: fertilizerAmount || 0,
                totalSquareFeet: totalLawnSize || 0
              })
            : poundsOfN,
        fertilizerAmount:
          changedField !== 'fertilizerAmount'
            ? getPoundsOfProductForDesiredN({
                totalSquareFeet: totalLawnSize || 0,
                desiredLbsOfNPer1000SqFt: poundsOfN || 0,
                guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`
              })
            : fertilizerAmount
      },
      { emitEvent: false }
    );
  }
}
