export type LawnHealthScoreBreakdown = {
  mowingScore: number;
  fertilizationScore: number;
  consistencyScore: number;
  recencyScore: number;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  description: string;
};

export type MonthlyData = {
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
  monthlyData: [MonthlyData, MonthlyData, MonthlyData];
  currentMonth: number;
  isGrowingSeason: boolean;
};
