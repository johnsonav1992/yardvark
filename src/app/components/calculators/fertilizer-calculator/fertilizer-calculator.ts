import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import {
//   getPoundsOfNInFertilizerApp,
//   getPoundsOfProductForDesiredN
// } from '../../../utils/lawnCalculatorUtils';
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
    this.fertilizerForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.calculate(v));
  }

  public calculate(formVal: typeof this.fertilizerForm.value): void {
    // const { totalLawnSize, nitrogenRate, poundsOfN, fertilizerAmount } =
    //   formVal;

    // determine which field changed
    const [changedField] = Object.entries(formVal)
      .filter(([key, value]) => {
        console.log(key, value);
        console.log(this.fertilizerForm.value);
        return (
          value !==
          this.fertilizerForm.value[
            key as keyof typeof this.fertilizerForm.value
          ]
        );
      })
      .map(([key]) => key);

    console.log({ changedField });

    // this.fertilizerForm.patchValue(
    //   {
    //     poundsOfN: getPoundsOfNInFertilizerApp({
    //       guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
    //       poundsOfProduct: fertilizerAmount || 0,
    //       totalSquareFeet: totalLawnSize || 0
    //     }),
    //     fertilizerAmount: getPoundsOfProductForDesiredN({
    //       totalSquareFeet: totalLawnSize || 0,
    //       desiredLbsOfNPer1000SqFt: poundsOfN || 0,
    //       guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`
    //     })
    //   },
    //   { emitEvent: false }
    // );
  }
}
