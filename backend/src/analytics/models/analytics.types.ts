export type MowingAnalyticsRowRes = {
  month: number;
  year: number;
  mowCount: string;
};

export type MowingAnalyticsRes = {
  mowingAnalyticsData: MowingAnalyticsRowRes[];
};
