import { Component, signal, computed } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { FormsModule } from '@angular/forms';
import {
  getNitrogenRateFromFields,
  getPoundsOfNInFertilizerApp,
  getPoundsOfProductForDesiredN
} from '../../../utils/lawnCalculatorUtils';

@Component({
  selector: 'fertilizer-calculator',
  imports: [
    InputTextModule,
    CardModule,
    ButtonModule,
    PopoverModule,
    FormsModule
  ],
  templateUrl: './fertilizer-calculator.html',
  styleUrl: './fertilizer-calculator.scss'
})
export class FertilizerCalculator {
  public totalLawnSize = signal<number | null>(null);
  public nitrogenRate = signal<number | null>(null);
  public poundsOfN = signal<number | null>(null);
  public fertilizerAmount = signal<number | null>(null);

  public effectiveTotalLawnSize = computed(() => this.totalLawnSize());

  public effectiveNitrogenRate = computed(() => {
    const nitrogenRate = this.nitrogenRate();
    if (nitrogenRate !== null) return nitrogenRate;

    const totalLawnSize = this.totalLawnSize();
    const poundsOfN = this.poundsOfN();
    const fertilizerAmount = this.fertilizerAmount();

    if (totalLawnSize && poundsOfN && fertilizerAmount) {
      const result = getNitrogenRateFromFields({
        totalLawnSize,
        poundsOfN,
        fertilizerAmount
      });
      return result;
    }
    return null;
  });

  public effectivePoundsOfN = computed(() => {
    const poundsOfN = this.poundsOfN();
    if (poundsOfN !== null) return poundsOfN;

    const totalLawnSize = this.totalLawnSize();
    const nitrogenRate = this.nitrogenRate();
    const fertilizerAmount = this.fertilizerAmount();

    if (totalLawnSize && nitrogenRate && fertilizerAmount) {
      const result = getPoundsOfNInFertilizerApp({
        guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`,
        poundsOfProduct: fertilizerAmount,
        totalSquareFeet: totalLawnSize
      });
      return result;
    }
    return null;
  });

  public effectiveFertilizerAmount = computed(() => {
    const fertilizerAmount = this.fertilizerAmount();
    if (fertilizerAmount !== null) return fertilizerAmount;

    const totalLawnSize = this.totalLawnSize();
    const poundsOfN = this.poundsOfN();
    const nitrogenRate = this.nitrogenRate();

    if (totalLawnSize && poundsOfN && nitrogenRate) {
      const result = getPoundsOfProductForDesiredN({
        totalSquareFeet: totalLawnSize,
        desiredLbsOfNPer1000SqFt: poundsOfN,
        guaranteedAnalysisOfProduct: `${nitrogenRate}-0-0`
      });
      return result;
    }
    return null;
  });

  private parseNumber(value: string | number | null): number | null {
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'number') return value;

    const strValue = value.toString().trim();
    if (strValue === '') return null;

    const normalizedValue = strValue.startsWith('.')
      ? '0' + strValue
      : strValue;

    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? null : parsed;
  }

  public onTotalLawnSizeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.totalLawnSize.set(this.parseNumber(value));
  }

  public onNitrogenRateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.nitrogenRate.set(this.parseNumber(value));
  }

  public onPoundsOfNChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.poundsOfN.set(this.parseNumber(value));
  }

  public onFertilizerAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fertilizerAmount.set(this.parseNumber(value));
  }
}
