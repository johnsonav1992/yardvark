import { differenceInDays } from 'date-fns';
import { LatLong } from '../types/location.types';
import { lawnSeasonDatesAndTemperaturesReference } from '../constants/soil-temperature-constants';

const SOIL_TEMP_SEASON_THRESHOLD = 55;

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

export const getLawnSeasonCompletedPercentageWithTemp = (
  coords: LatLong,
  currentSoilTemp: number | null | undefined,
  temperatureUnit: 'fahrenheit' | 'celsius' = 'fahrenheit'
) => {
  const today = new Date();
  const { start, end } = getLawnSeasonStartAndEndDates(coords);

  if (currentSoilTemp !== null && currentSoilTemp !== undefined) {
    const tempInFahrenheit =
      temperatureUnit === 'celsius'
        ? (currentSoilTemp * 9) / 5 + 32
        : currentSoilTemp;

    if (tempInFahrenheit < SOIL_TEMP_SEASON_THRESHOLD) {
      return today < start ? -1 : 100;
    }

    const tempDifferential = tempInFahrenheit - SOIL_TEMP_SEASON_THRESHOLD;
    const weeksPerDegree = 0.2;
    const adjustmentWeeks = Math.round(tempDifferential * weeksPerDegree);
    const adjustmentDays = adjustmentWeeks * 7;

    const adjustedStart = new Date(start);
    adjustedStart.setDate(adjustedStart.getDate() - adjustmentDays);

    const adjustedEnd = new Date(end);
    adjustedEnd.setDate(adjustedEnd.getDate() + adjustmentDays);

    if (today < adjustedStart) return -1;
    if (today > adjustedEnd) return 100;

    const totalDaysInSeason = differenceInDays(adjustedEnd, adjustedStart);
    const daysPassed = differenceInDays(today, adjustedStart);

    return Math.round((daysPassed / totalDaysInSeason) * 100);
  }

  return getLawnSeasonCompletedPercentage(coords);
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
