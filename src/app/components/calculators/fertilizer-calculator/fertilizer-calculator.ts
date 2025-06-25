import { Component, signal } from '@angular/core';
import {
  getPoundsOfNInFertilizerApp,
  getPoundsOfProductForDesiredN
} from '../../../utils/lawnCalculatorUtils';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'fertilizer-calculator',
  imports: [FormsModule, InputTextModule],
  templateUrl: './fertilizer-calculator.html',
  styleUrl: './fertilizer-calculator.scss'
})
export class FertilizerCalculator {
  public totalLawnSize = signal<number | null>(null);
  public nitrogenRate = signal<number | null>(null);

  public poundsOfN = signal<number | null>(null);
  public fertilizerAmount = signal<number | null>(null);

  public onPoundsOfNChange(newPoundsOfN: number | null): void {
    this.poundsOfN.set(newPoundsOfN);

    if (newPoundsOfN === null) {
      return this.fertilizerAmount.set(null);
    }

    const totalLawnSize = this.totalLawnSize();
    const nitrogenRate = this.nitrogenRate();

    if (totalLawnSize && nitrogenRate) {
      const calculatedFertilizerAmount = getPoundsOfProductForDesiredN({
        desiredLbsOfNPer1000SqFt: newPoundsOfN,
        guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
        totalSquareFeet: totalLawnSize
      });

      this.fertilizerAmount.set(calculatedFertilizerAmount);
    }
  }

  public onFertilizerAmountChange(newFertilizerAmount: number | null): void {
    this.fertilizerAmount.set(newFertilizerAmount);

    if (newFertilizerAmount === null) {
      return this.poundsOfN.set(null);
    }

    const totalLawnSize = this.totalLawnSize();
    const nitrogenRate = this.nitrogenRate();

    if (totalLawnSize && nitrogenRate) {
      const calculatedPoundsOfN = getPoundsOfNInFertilizerApp({
        poundsOfProduct: newFertilizerAmount,
        guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
        totalSquareFeet: totalLawnSize
      });

      this.poundsOfN.set(calculatedPoundsOfN);
    }
  }
}
