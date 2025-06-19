import { differenceInDays } from 'date-fns';
import { LatLong } from '../types/location.types';
import { lawnSeasonDatesAndTemperaturesReference } from '../constants/soil-temperature-constants';

/**
 * Calculates the percentage of the lawn season that has been completed based on the current date.
 *
 * @param coords - The latitude and longitude coordinates.
 * @returns A number representing the percentage of the lawn season completed (0-100), or -1 if the season has not started yet.
 */
export const getLawnSeasonCompletedPercentage = (coords: LatLong) => {
  const today = new Date();

  const { start, end } = getLawnSeasonStartAndEndDates(coords);

  const seasonStart = start;
  const seasonEnd = end;

  if (today < seasonStart) return -1;

  if (today > seasonEnd) return 101;

  const totalDaysInLawnSeason = differenceInDays(seasonEnd, seasonStart);
  const daysPassedInLawnSeason = differenceInDays(today, seasonStart);

  return Math.round((daysPassedInLawnSeason / totalDaysInLawnSeason) * 100);
};

/**
 * Interpolates the start and end dates of the lawn season based on latitude.
 *
 * @param coords - The latitude and longitude coordinates.
 * @returns An object containing the start and end dates of the lawn season.
 */
export const getLawnSeasonStartAndEndDates = (coords: LatLong) => {
  const clampedLat = Math.max(30, Math.min(50, coords.lat));
  const year = new Date().getFullYear();

  let closestReference = lawnSeasonDatesAndTemperaturesReference[0];
  let minDistance = Math.abs(clampedLat - closestReference.lat);

  for (let i = 1; i < lawnSeasonDatesAndTemperaturesReference.length; i++) {
    const reference = lawnSeasonDatesAndTemperaturesReference[i];
    const distance = Math.abs(clampedLat - reference.lat);

    if (distance < minDistance) {
      minDistance = distance;
      closestReference = reference;
    }
  }

  return {
    start: new Date(
      year,
      closestReference.spring.month,
      closestReference.spring.day
    ),
    end: new Date(year, closestReference.fall.month, closestReference.fall.day)
  };
};
