export type MowingAnalyticsRowRes = {
  month: number;
  year: number;
  mowCount: string;
};

export type FertilizerTimelineRowRes = {
  applicationDate: string;
  productName: string;
  productQuantity: number;
  productQuantityUnit: string;
  guaranteedAnalysis: string;
  totalSquareFeet: number;
};

export type ProductTypeDistributionRowRes = {
  category: string;
  usageCount: number;
};

export type AverageDaysBetweenRowRes = {
  month: string;
  year: number;
  monthNumber: number;
  avgMowingDays: number;
  avgFertilizingDays: number;
};

export type AnalyticsRes = [
  {
    get_user_analytics_v2: {
      mowingAnalyticsData: MowingAnalyticsRowRes[];
      fertilizerTimelineData: FertilizerTimelineRowRes[];
      productTypeDistributionData: ProductTypeDistributionRowRes[];
      averageDaysBetweenData: AverageDaysBetweenRowRes[];
    };
  },
];
