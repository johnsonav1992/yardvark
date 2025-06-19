import { ChartData, ChartOptions, ChartType } from 'chart.js';

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

export type AnalyticsRes = {
  mowingAnalyticsData: MowingAnalyticsRowRes[];
  fertilizerTimelineData: FertilizerTimelineRowRes[];
  productTypeDistributionData: ProductTypeDistributionRowRes[];
};

export type AnalyticsChartConfig<TType extends ChartType = ChartType> = {
  title: string;
  desc?: string;
  chartData: ChartData<TType>;
  options: ChartOptions;
};
