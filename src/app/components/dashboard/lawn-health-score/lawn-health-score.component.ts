import { Component, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { DividerDesignTokens } from '@primeng/themes/types/divider';
import { AnalyticsService } from '../../../services/analytics.service';
import { EntriesService } from '../../../services/entries.service';
import { 
  calculateLawnHealthScore, 
  isCurrentlyGrowingSeason, 
  getDaysSince,
  LawnHealthScoreFactors 
} from '../../../utils/lawnHealthUtils';
import { getPoundsOfNInFertilizerApp } from '../../../utils/lawnCalculatorUtils';

@Component({
  selector: 'lawn-health-score',
  imports: [CardModule, DividerModule],
  templateUrl: './lawn-health-score.component.html',
  styleUrl: './lawn-health-score.component.scss'
})
export class LawnHealthScoreComponent {
  private _analyticsService = inject(AnalyticsService);
  private _entriesService = inject(EntriesService);

  public analyticsData = this._analyticsService.analyticsData;
  public lastMowDate = this._entriesService.lastMow;
  public lastProductApp = this._entriesService.lastProductApp;

  public healthScoreFactors = computed((): LawnHealthScoreFactors => {
    const lastMow = this.lastMowDate.value();
    const lastProductAppData = this.lastProductApp.value();

    const currentMonth = new Date().getMonth() + 1;
    const isGrowingSeason = isCurrentlyGrowingSeason();

    const daysSinceLastMow = lastMow?.lastMowDate 
      ? getDaysSince(lastMow.lastMowDate.toString()) 
      : 999;

    const daysSinceLastFertilizer = lastProductAppData?.lastProductAppDate 
      ? getDaysSince(lastProductAppData.lastProductAppDate.toString()) 
      : 999;

    const avgMowingDays = this.calculateAverageMowingDays();
    const totalNitrogenThisYear = this.calculateTotalNitrogenThisYear();
    const fertilizerApplicationsThisYear = this.countFertilizerApplicationsThisYear();

    return {
      daysSinceLastMow,
      daysSinceLastFertilizer,
      totalNitrogenThisYear,
      entriesLast30Days: 2,
      mowingConsistency: avgMowingDays,
      fertilizerApplicationsThisYear,
      currentMonth,
      isGrowingSeason
    };
  });

  public lawnHealthScore = computed(() => {
    const analyticsData = this.analyticsData.value();
    const factors = this.healthScoreFactors();
    
    return calculateLawnHealthScore(analyticsData, factors);
  });

  public scoreColor = computed(() => {
    const score = this.lawnHealthScore().totalScore;
    if (score >= 90) return 'var(--p-green-500)';
    if (score >= 80) return 'var(--p-blue-500)';
    if (score >= 70) return 'var(--p-yellow-500)';
    if (score >= 60) return 'var(--p-orange-500)';
    return 'var(--p-red-500)';
  });

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: 'none'
    }
  };

  private calculateAverageMowingDays(): number {
    const analyticsData = this.analyticsData.value();
    if (!analyticsData?.averageDaysBetweenData) return 0;

    const recentMowingData = analyticsData.averageDaysBetweenData
      .filter(item => item.avgMowingDays > 0)
      .slice(-3);

    if (recentMowingData.length === 0) return 0;

    const totalDays = recentMowingData.reduce((sum, item) => sum + item.avgMowingDays, 0);
    return totalDays / recentMowingData.length;
  }

  private calculateTotalNitrogenThisYear(): number {
    const analyticsData = this.analyticsData.value();
    if (!analyticsData?.fertilizerTimelineData) return 0;

    const currentYear = new Date().getFullYear();
    
    return analyticsData.fertilizerTimelineData
      .filter(app => new Date(app.applicationDate).getFullYear() === currentYear)
      .reduce((total, app) => {
        const isLiquid = app.productQuantityUnit === 'oz' || app.productQuantityUnit === 'fl oz';
        const productWeight = isLiquid 
          ? app.productQuantity * 0.1 
          : app.productQuantity;

        const nitrogenValue = getPoundsOfNInFertilizerApp({
          poundsOfProduct: productWeight,
          guaranteedAnalysisOfProduct: app.guaranteedAnalysis,
          totalSquareFeet: app.totalSquareFeet
        });

        return total + nitrogenValue;
      }, 0);
  }

  private countFertilizerApplicationsThisYear(): number {
    const analyticsData = this.analyticsData.value();
    if (!analyticsData?.fertilizerTimelineData) return 0;

    const currentYear = new Date().getFullYear();
    
    return analyticsData.fertilizerTimelineData
      .filter(app => new Date(app.applicationDate).getFullYear() === currentYear)
      .length;
  }
}