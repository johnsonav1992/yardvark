import { AnalyticsRes } from '../types/analytics.types';

export type LawnHealthScoreBreakdown = {
  mowingScore: number;
  fertilizationScore: number;
  consistencyScore: number;
  recencyScore: number;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  description: string;
};

export type LawnHealthScoreFactors = {
  daysSinceLastMow: number;
  daysSinceLastFertilizer: number;
  totalNitrogenThisYear: number;
  entriesLast30Days: number;
  mowingConsistency: number;
  fertilizerApplicationsThisYear: number;
  currentMonth: number;
  isGrowingSeason: boolean;
};

export const calculateLawnHealthScore = (
  analyticsData: AnalyticsRes | undefined,
  factors: LawnHealthScoreFactors
): LawnHealthScoreBreakdown => {
  if (!analyticsData) {
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

  const mowingScore = calculateMowingScore(factors);
  const fertilizationScore = calculateFertilizationScore(factors);
  const consistencyScore = calculateConsistencyScore(factors);
  const recencyScore = calculateRecencyScore(factors);

  const totalScore = Math.min(100, mowingScore + fertilizationScore + consistencyScore + recencyScore);
  
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

const calculateMowingScore = (factors: LawnHealthScoreFactors): number => {
  const { mowingConsistency, isGrowingSeason } = factors;
  
  if (mowingConsistency === 0) return 0;
  
  const idealRange = isGrowingSeason ? { min: 3, max: 7 } : { min: 14, max: 21 };
  
  if (mowingConsistency >= idealRange.min && mowingConsistency <= idealRange.max) {
    return 30;
  }
  
  const deviation = Math.min(
    Math.abs(mowingConsistency - idealRange.max), 
    Math.abs(mowingConsistency - idealRange.min)
  );
  
  return Math.max(0, 30 - (deviation * 3));
};

const calculateFertilizationScore = (factors: LawnHealthScoreFactors): number => {
  const { totalNitrogenThisYear, fertilizerApplicationsThisYear, currentMonth } = factors;
  
  let score = 0;
  
  const idealAnnualNitrogen = 3;
  const expectedNitrogenByMonth = (idealAnnualNitrogen * currentMonth) / 12;
  
  if (totalNitrogenThisYear >= expectedNitrogenByMonth * 0.7 && 
      totalNitrogenThisYear <= expectedNitrogenByMonth * 1.3) {
    score += 15;
  } else {
    const nitrogenDeviation = Math.abs(totalNitrogenThisYear - expectedNitrogenByMonth);
    score += Math.max(0, 15 - (nitrogenDeviation * 8));
  }
  
  const expectedApplicationsByMonth = Math.ceil(currentMonth / 3);
  if (fertilizerApplicationsThisYear >= expectedApplicationsByMonth * 0.8) {
    score += 10;
  } else if (fertilizerApplicationsThisYear > 0) {
    score += 5;
  }
  
  return Math.min(25, score);
};

const calculateConsistencyScore = (factors: LawnHealthScoreFactors): number => {
  const { entriesLast30Days } = factors;
  
  if (entriesLast30Days >= 4) {
    return 20;
  } else if (entriesLast30Days >= 2) {
    return 12;
  } else if (entriesLast30Days >= 1) {
    return 6;
  }
  
  return 0;
};

const calculateRecencyScore = (factors: LawnHealthScoreFactors): number => {
  const { daysSinceLastMow, daysSinceLastFertilizer, isGrowingSeason, currentMonth } = factors;
  
  let score = 25;
  
  if (isGrowingSeason && daysSinceLastMow > 10) {
    score -= 8;
  } else if (isGrowingSeason && daysSinceLastMow > 7) {
    score -= 4;
  }
  
  const isSpringFertilizerSeason = currentMonth >= 3 && currentMonth <= 5;
  const isFallFertilizerSeason = currentMonth >= 9 && currentMonth <= 11;
  
  if ((isSpringFertilizerSeason || isFallFertilizerSeason) && daysSinceLastFertilizer > 90) {
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
  const currentMonth = new Date().getMonth() + 1;
  return currentMonth >= 4 && currentMonth <= 10;
};

export const getDaysSince = (dateString: string | null): number => {
  if (!dateString) return 999;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};