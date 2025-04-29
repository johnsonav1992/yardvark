import { differenceInDays } from 'date-fns';

export const getLawnSeasonCompletedPercentage = () => {
  const currentYear = new Date().getFullYear();

  // AVJ: hard-coded dates for the season for now - will fetch dates soon
  const seasonStart = new Date(`${currentYear}-02-15`);
  const seasonEnd = new Date(`${currentYear}-11-01`);

  const totalDaysInLawnSeason = differenceInDays(seasonEnd, seasonStart);
  const daysPassedInLawnSeason = differenceInDays(new Date(), seasonStart);

  return Math.round((daysPassedInLawnSeason / totalDaysInLawnSeason) * 100);
};
