import { ChartData, ChartOptions, ChartType } from 'chart.js';

export type MowingAnalyticsRowRes = {
  month: number;
  year: number;
  mowCount: string;
};

export type AnalyticsRes = {
  mowingAnalyticsData: MowingAnalyticsRowRes[];
};

export type AnalyticsChartConfig<TType extends ChartType = ChartType> = {
  title: string;
  chartData: ChartData<TType>;
  options: ChartOptions;
};
