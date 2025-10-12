export type LawnHealthScoreBreakdown = {
  mowingScore: number;
  fertilizationScore: number;
  consistencyScore: number;
  recencyScore: number;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'Off-Season';
  description: string;
  isOffSeason?: boolean;
};

export type LawnHealthScoreMonthlyData = {
  mowingFrequency: number;
  nitrogenAmount: number;
  fertilizerApplications: number;
  entriesCount: number;
  month: number;
  year: number;
  isGrowingSeason: boolean;
};

export type LawnHealthScoreFactors = {
  daysSinceLastMow: number;
  daysSinceLastFertilizer: number;
  monthlyData: [
    LawnHealthScoreMonthlyData,
    LawnHealthScoreMonthlyData,
    LawnHealthScoreMonthlyData
  ];
  currentMonth: number;
  isGrowingSeason: boolean;
};

export interface ScoreBreakdown {
  totalScore: number;
  grade: string;
  mowingScore: number;
  fertilizationScore: number;
  consistencyScore: number;
  recencyScore: number;
}
