import { Component, computed, linkedSignal, signal } from '@angular/core';
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

  public fertilizerAmount = linkedSignal(() => {
    const totalLawnSize = this.totalLawnSizeSignal();
    const poundsOfN = this.poundsOfNSignal();
    const nitrogenRate = this.nitrogenRateSignal();

    return getPoundsOfProductForDesiredN({
      desiredLbsOfNPer1000SqFt: poundsOfN || 0,
      guaranteedAnalysisOfProduct: `${nitrogenRate || 0}-0-0`,
      totalSquareFeet: totalLawnSize || 0
    });
  });
}
