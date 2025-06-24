import { Component, computed, signal } from '@angular/core';
import { getPoundsOfProductForDesiredN } from '../../../utils/lawnCalculatorUtils';

@Component({
  selector: 'fertilizer-calculator',
  imports: [],
  templateUrl: './fertilizer-calculator.html',
  styleUrl: './fertilizer-calculator.scss'
})
export class FertilizerCalculator {
  private totalLawnSizeSignal = signal<number | null>(null);
  private poundsOfNSignal = signal<number | null>(null);
  private nitrogenRateSignal = signal<number | null>(null);

  public formValid = computed(
    () =>
      this.totalLawnSizeSignal() != null &&
      this.poundsOfNSignal() != null &&
      this.nitrogenRateSignal() != null
  );

  public fertilizerAmount = computed(() => {
    const totalLawnSize = this.totalLawnSizeSignal();
    const poundsOfN = this.poundsOfNSignal();
    const nitrogenRate = this.nitrogenRateSignal();

    if (!this.formValid() || !totalLawnSize || !poundsOfN || !nitrogenRate) {
      return null;
    }

    return getPoundsOfProductForDesiredN({
      desiredLbsOfNPer1000SqFt: poundsOfN,
      guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
      totalSquareFeet: totalLawnSize
    });
  });
}
