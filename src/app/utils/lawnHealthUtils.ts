import { AnalyticsRes } from '../types/analytics.types';
import {
  LawnHealthScoreBreakdown,
  LawnHealthScoreFactors,
  MonthlyData
} from '../types/lawnHealthScore.types';
import { getMonth, getYear, getDate } from 'date-fns';

export const calculateLawnHealthScore = (
  analyticsData: AnalyticsRes | undefined,
  factors: LawnHealthScoreFactors
): LawnHealthScoreBreakdown => {
  if (
    !analyticsData ||
    (!analyticsData.mowingAnalyticsData?.length &&
      !analyticsData.fertilizerTimelineData?.length &&
      !analyticsData.productTypeDistributionData?.length &&
      !analyticsData.averageDaysBetweenData?.length)
  ) {
    return {
      mowingScore: 0,
      fertilizationScore: 0,
      consistencyScore: 0,
      recencyScore: 0,
      totalScore: 0,
      grade: 'F',
      description: 'No data available'
    };
  }

  const totalMowingEntries =
    analyticsData.mowingAnalyticsData?.reduce(
      (sum, month) => sum + parseInt(month.mowCount),
      0
    ) || 0;
  const totalFertilizerEntries =
    analyticsData.fertilizerTimelineData?.length || 0;
  const totalEntries = totalMowingEntries + totalFertilizerEntries;

  if (totalEntries < 3) {
    return {
      mowingScore: 0,
      fertilizationScore: 0,
      consistencyScore: 0,
      recencyScore: 0,
      totalScore: 0,
      grade: 'F',
      description: 'Add more entries for accurate scoring'
    };
  }

  const mowingScore = calculateMowingScore(factors);
  const fertilizationScore = calculateFertilizationScore(factors);
  const consistencyScore = calculateConsistencyScore(factors);
  const recencyScore = calculateRecencyScore(factors);

  const totalScore = Math.round(
    Math.min(
      100,
      mowingScore + fertilizationScore + consistencyScore + recencyScore
    )
  );

  return {
    mowingScore,
    fertilizationScore,
    consistencyScore,
    recencyScore,
    totalScore,
    grade: getHealthGrade(totalScore),
    description: getHealthDescription(totalScore)
  };
};

const getAdaptiveWeights = (
  currentMonthData: MonthlyData
): [number, number, number] => {
  const now = new Date();
  const currentMonth = getMonth(now) + 1;
  const currentYear = getYear(now);
  const dayOfMonth = getDate(now);

  if (
    currentMonthData.month === currentMonth &&
    currentMonthData.year === currentYear
  ) {
    if (dayOfMonth <= 7) {
      return [0.05, 0.45, 0.5];
    } else if (dayOfMonth <= 14) {
      return [0.15, 0.4, 0.45];
    } else if (dayOfMonth <= 21) {
      return [0.3, 0.35, 0.35];
    }
  }

  return [0.5, 0.3, 0.2];
};

const calculateMowingScore = (factors: LawnHealthScoreFactors): number => {
  const { monthlyData } = factors;
  const weights = getAdaptiveWeights(monthlyData[0]);

  let weightedScore = 0;

  monthlyData.forEach((monthData, index) => {
    const monthScore = calculateMonthlyMowingScore(monthData);

    weightedScore += monthScore * weights[index];
  });

  return Math.round(weightedScore);
};

const calculateMonthlyMowingScore = (monthData: MonthlyData): number => {
  const { mowingFrequency, isGrowingSeason } = monthData;

  if (mowingFrequency === 0) return 0;

  const expectedMows = isGrowingSeason ? 6 : 2;

  if (mowingFrequency >= expectedMows) return 30;

  const shortage = expectedMows - mowingFrequency;

  if (shortage <= 1) return 25;
  if (shortage <= 2) return 18;
  if (shortage <= 3) return 10;

  return Math.max(0, 30 - shortage * 5);
};

const calculateFertilizationScore = (
  factors: LawnHealthScoreFactors
): number => {
  const { monthlyData } = factors;
  const weights = getAdaptiveWeights(monthlyData[0]);

  let weightedScore = 0;

  monthlyData.forEach((monthData, index) => {
    const monthScore = calculateMonthlyFertilizationScore(monthData);

    weightedScore += monthScore * weights[index];
  });

  return Math.round(weightedScore);
};

const calculateMonthlyFertilizationScore = (monthData: MonthlyData): number => {
  const { nitrogenAmount, fertilizerApplications, month } = monthData;

  let score = 0;

  const isGrowingSeason = month >= 3 && month <= 11;
  const isDormantSeason = month === 12 || month === 1 || month === 2;

  if (isDormantSeason) {
    score += nitrogenAmount === 0 ? 15 : Math.max(0, 15 - nitrogenAmount * 15);
    score +=
      fertilizerApplications === 0
        ? 10
        : Math.max(0, 10 - fertilizerApplications * 3);
  } else if (isGrowingSeason) {
    if (nitrogenAmount > 0 && nitrogenAmount <= 1.0) {
      score += 15;
    } else if (nitrogenAmount <= 0.2) {
      score += 10;
    } else if (nitrogenAmount > 1.0) {
      score += Math.max(5, 15 - (nitrogenAmount - 1.0) * 8);
    } else {
      score += 5;
    }

    if (fertilizerApplications >= 1) {
      score += 10;
    } else {
      score += 5;
    }
  }

  return Math.min(25, score);
};

const calculateConsistencyScore = (factors: LawnHealthScoreFactors): number => {
  const { monthlyData } = factors;
  const weights = getAdaptiveWeights(monthlyData[0]);

  let weightedScore = 0;

  monthlyData.forEach((monthData, index) => {
    const monthScore = calculateMonthlyConsistencyScore(monthData);

    weightedScore += monthScore * weights[index];
  });

  return Math.round(weightedScore);
};

const calculateMonthlyConsistencyScore = (monthData: MonthlyData): number => {
  const { entriesCount, isGrowingSeason } = monthData;

  const expectedEntries = isGrowingSeason ? 6 : 3;

  if (entriesCount >= expectedEntries) {
    return 20;
  } else if (entriesCount >= expectedEntries * 0.7) {
    return 15;
  } else if (entriesCount >= expectedEntries * 0.5) {
    return 10;
  } else if (entriesCount >= 1) {
    return 5;
  }

  return 0;
};

const calculateRecencyScore = (factors: LawnHealthScoreFactors): number => {
  const {
    daysSinceLastMow,
    daysSinceLastFertilizer,
    isGrowingSeason,
    currentMonth
  } = factors;

  let score = 25;

  if (isGrowingSeason && daysSinceLastMow > 10) {
    score -= 8;
  } else if (isGrowingSeason && daysSinceLastMow > 7) {
    score -= 4;
  }

  const isSpringFertilizerSeason = currentMonth >= 3 && currentMonth <= 5;
  const isFallFertilizerSeason = currentMonth >= 9 && currentMonth <= 11;

  if (
    (isSpringFertilizerSeason || isFallFertilizerSeason) &&
    daysSinceLastFertilizer > 90
  ) {
    score -= 8;
  }

  return Math.max(0, score);
};

const getHealthGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';

  return 'F';
};

const getHealthDescription = (score: number): string => {
  if (score >= 90) return 'Excellent lawn care program!';
  if (score >= 80) return 'Good routine, minor improvements possible';
  if (score >= 70) return 'Fair program, some areas need attention';
  if (score >= 60) return 'Below average, consider more consistent care';

  return 'Needs significant improvement';
};

export const isCurrentlyGrowingSeason = (): boolean => {
  const currentMonth = getMonth(new Date()) + 1;

  return currentMonth >= 4 && currentMonth <= 10;
};
