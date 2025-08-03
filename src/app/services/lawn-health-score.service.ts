import { Injectable, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, map } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { EntriesService } from './entries.service';
import { AiService } from './ai.service';
import {
  calculateLawnHealthScore,
  isCurrentlyGrowingSeason
} from '../utils/lawnHealthUtils';
import { getPoundsOfNInFertilizerApp } from '../utils/lawnCalculatorUtils';
import {
  LawnHealthScoreFactors,
  LawnHealthScoreMonthlyData,
  LawnHealthScoreBreakdown
} from '../types/lawnHealthScore.types';
import {
  subMonths,
  getMonth,
  getYear,
  isSameMonth,
  isSameYear,
  differenceInDays
} from 'date-fns';

interface ScoreBreakdown {
  totalScore: number;
  grade: string;
  mowingScore: number;
  fertilizationScore: number;
  consistencyScore: number;
  recencyScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class LawnHealthScoreService {
  private _analyticsService = inject(AnalyticsService);
  private _entriesService = inject(EntriesService);
  private _aiService = inject(AiService);

  public analyticsData = this._analyticsService.analyticsData;
  public lastMowDate = this._entriesService.lastMow;
  public lastProductApp = this._entriesService.lastProductApp;

  public healthScoreFactors = computed((): LawnHealthScoreFactors => {
    const lastMow = this.lastMowDate.value();
    const lastProductAppData = this.lastProductApp.value();

    const currentMonth = getMonth(new Date()) + 1;
    const isGrowingSeason = isCurrentlyGrowingSeason();

    const daysSinceLastMow = lastMow?.lastMowDate
      ? differenceInDays(new Date(), lastMow.lastMowDate.toString())
      : 999;

    const daysSinceLastFertilizer = lastProductAppData?.lastProductAppDate
      ? differenceInDays(
          new Date(),
          lastProductAppData.lastProductAppDate.toString()
        )
      : 999;

    const monthlyData = this.getLast3MonthsData();

    return {
      daysSinceLastMow,
      daysSinceLastFertilizer,
      monthlyData,
      currentMonth,
      isGrowingSeason
    };
  });

  public lawnHealthScore = computed((): LawnHealthScoreBreakdown => {
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

  private getCachedDescription(scoreBreakdown: ScoreBreakdown): string | null {
    try {
      const cached = localStorage.getItem('lawnHealthAiCache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (
          cacheData.totalScore === scoreBreakdown.totalScore &&
          cacheData.grade === scoreBreakdown.grade &&
          cacheData.mowingScore === scoreBreakdown.mowingScore &&
          cacheData.fertilizationScore === scoreBreakdown.fertilizationScore &&
          cacheData.consistencyScore === scoreBreakdown.consistencyScore &&
          cacheData.recencyScore === scoreBreakdown.recencyScore
        ) {
          return cacheData.description;
        }
      }
    } catch (error) {
      console.warn('Failed to read AI cache:', error);
    }
    return null;
  }

  private setCachedDescription(
    scoreBreakdown: ScoreBreakdown,
    description: string
  ): void {
    try {
      const cacheData = {
        ...scoreBreakdown,
        description,
        timestamp: Date.now()
      };
      localStorage.setItem('lawnHealthAiCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache AI description:', error);
    }
  }

  public aiDescriptionResource = rxResource({
    params: () => {
      const scoreData = this.lawnHealthScore();
      return scoreData.totalScore > 0
        ? {
            totalScore: scoreData.totalScore,
            grade: scoreData.grade,
            mowingScore: scoreData.mowingScore,
            fertilizationScore: scoreData.fertilizationScore,
            consistencyScore: scoreData.consistencyScore,
            recencyScore: scoreData.recencyScore
          }
        : undefined;
    },
    stream: ({ params }: { params: ScoreBreakdown }) => {
      const cached = this.getCachedDescription(params);

      if (cached) {
        return of(cached);
      }

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const prompt = `Today is ${currentDate}. Generate a brief, encouraging lawn care description (max 30 words) for someone with a lawn health score of ${params.totalScore}/100 (Grade: ${params.grade}). Focus on positive reinforcement and seasonal next steps.`;

      return this._aiService.sendChatMessageContent(prompt).pipe(
        map((response) => {
          if (response) {
            this.setCachedDescription(params, response);
          }
          return response;
        })
      );
    }
  });

  public finalDescription = computed(() => {
    const aiResource = this.aiDescriptionResource;
    const fallbackDesc = this.lawnHealthScore().description;

    if (aiResource.hasValue() && aiResource.value()) {
      return aiResource.value();
    }

    return fallbackDesc;
  });

  private getLast3MonthsData(): [
    LawnHealthScoreMonthlyData,
    LawnHealthScoreMonthlyData,
    LawnHealthScoreMonthlyData
  ] {
    const now = new Date();

    const months = [];
    for (let i = 0; i < 3; i++) {
      const targetDate = subMonths(now, i);
      const month = getMonth(targetDate) + 1;
      const year = getYear(targetDate);

      months.push({
        mowingFrequency: this.getMowingFrequencyForMonth(month, year),
        nitrogenAmount: this.getNitrogenForMonth(month, year),
        fertilizerApplications: this.getFertilizerApplicationsForMonth(
          month,
          year
        ),
        entriesCount: this.getEntriesForMonth(month, year),
        month,
        year,
        isGrowingSeason: month >= 4 && month <= 10
      });
    }

    return months as [
      LawnHealthScoreMonthlyData,
      LawnHealthScoreMonthlyData,
      LawnHealthScoreMonthlyData
    ];
  }

  private getMowingFrequencyForMonth(month: number, year: number): number {
    const analyticsData = this.analyticsData.value();
    if (!analyticsData?.mowingAnalyticsData) return 0;

    const monthData = analyticsData.mowingAnalyticsData.find(
      (item) => item.month === month && item.year === year
    );

    return monthData ? +monthData.mowCount : 0;
  }

  private getNitrogenForMonth(month: number, year: number): number {
    const analyticsData = this.analyticsData.value();
    if (!analyticsData?.fertilizerTimelineData) return 0;

    return analyticsData.fertilizerTimelineData
      .filter((app) => {
        const appDate = new Date(app.applicationDate);
        const targetDate = new Date(year, month - 1, 1);
        return (
          isSameMonth(appDate, targetDate) && isSameYear(appDate, targetDate)
        );
      })
      .reduce((total, app) => {
        const isLiquid =
          app.productQuantityUnit === 'oz' ||
          app.productQuantityUnit === 'fl oz';
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

  private getFertilizerApplicationsForMonth(
    month: number,
    year: number
  ): number {
    const analyticsData = this.analyticsData.value();
    if (!analyticsData?.fertilizerTimelineData) return 0;

    return analyticsData.fertilizerTimelineData.filter((app) => {
      const appDate = new Date(app.applicationDate);
      const targetDate = new Date(year, month - 1, 1);
      return (
        isSameMonth(appDate, targetDate) && isSameYear(appDate, targetDate)
      );
    }).length;
  }

  private getEntriesForMonth(month: number, year: number): number {
    const analyticsData = this.analyticsData.value();
    if (
      !analyticsData?.mowingAnalyticsData &&
      !analyticsData?.fertilizerTimelineData
    )
      return 2;

    const mowingEntries =
      analyticsData?.mowingAnalyticsData?.find(
        (item) => item.month === month && item.year === year
      )?.mowCount || '0';

    const fertilizerEntries =
      analyticsData?.fertilizerTimelineData?.filter((app) => {
        const appDate = new Date(app.applicationDate);
        const targetDate = new Date(year, month - 1, 1);
        return (
          isSameMonth(appDate, targetDate) && isSameYear(appDate, targetDate)
        );
      }).length || 0;

    return +mowingEntries + fertilizerEntries;
  }
}
