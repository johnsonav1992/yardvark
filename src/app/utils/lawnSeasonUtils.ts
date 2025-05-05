import { differenceInDays } from 'date-fns';

export const getLawnSeasonCompletedPercentage = () => {
  const currentYear = new Date().getFullYear();
  const today = new Date();

  // AVJ: hard-coded dates for the season for now - will fetch dates soon
  const seasonStart = new Date(`${currentYear}-02-15`);
  const seasonEnd = new Date(`${currentYear}-11-01`);

  if (today < seasonStart) {
    return -1;
  }

  if (today > seasonEnd) {
    return 101;
  }

  const totalDaysInLawnSeason = differenceInDays(seasonEnd, seasonStart);
  const daysPassedInLawnSeason = differenceInDays(today, seasonStart);

  return Math.round((daysPassedInLawnSeason / totalDaysInLawnSeason) * 100);
};
