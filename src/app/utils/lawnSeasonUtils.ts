import { differenceInDays } from 'date-fns';
import { LatLong } from '../types/location.types';
import { lawnSeasonDatesAndTemperaturesReference } from '../constants/soil-temperature-constants';

const SOIL_TEMP_SEASON_THRESHOLD = 50;

const convertToFahrenheit = (
  temp: number,
  unit: 'fahrenheit' | 'celsius'
): number => {
  return unit === 'celsius' ? (temp * 9) / 5 + 32 : temp;
};

const isDormantTemperature = (tempInFahrenheit: number): boolean => {
  return tempInFahrenheit < SOIL_TEMP_SEASON_THRESHOLD;
};

const calculateDateBasedPercentage = (
  today: Date,
  start: Date,
  end: Date
): number => {
  const totalDaysInSeason = differenceInDays(end, start);
  const daysPassed = differenceInDays(today, start);
  return (daysPassed / totalDaysInSeason) * 100;
};

const isSpringPhase = (
  daysPassed: number,
  totalDaysInSeason: number
): boolean => {
  const midpoint = totalDaysInSeason / 2;
  return daysPassed < midpoint;
};

const calculateSpringPercentage = (dateBasedPercentage: number): number => {
  return Math.round(Math.min(50, dateBasedPercentage));
};

const calculateTemperatureWeight = (tempAboveThreshold: number): number => {
  const maxTempRange = 15;
  return Math.max(
    0,
    Math.min(1, (maxTempRange - tempAboveThreshold) / maxTempRange)
  );
};

const calculateTemperaturePercentage = (tempAboveThreshold: number): number => {
  return 100 - tempAboveThreshold;
};

const blendPercentages = (
  datePercentage: number,
  tempPercentage: number,
  tempWeight: number
): number => {
  const dateWeight = 1 - tempWeight;
  const blended = datePercentage * dateWeight + tempPercentage * tempWeight;
  return Math.round(Math.max(50, Math.min(100, blended)));
};

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
    const tempInFahrenheit = convertToFahrenheit(
      currentSoilTemp,
      temperatureUnit
    );

    if (isDormantTemperature(tempInFahrenheit)) {
      return today < start ? -1 : 100;
    }

    if (today < start) return -1;
    if (today > end) return 100;

    const totalDaysInSeason = differenceInDays(end, start);
    const daysPassed = differenceInDays(today, start);
    const dateBasedPercentage = calculateDateBasedPercentage(today, start, end);

    if (isSpringPhase(daysPassed, totalDaysInSeason)) {
      return calculateSpringPercentage(dateBasedPercentage);
    }

    const tempAboveThreshold = tempInFahrenheit - SOIL_TEMP_SEASON_THRESHOLD;
    const tempWeight = calculateTemperatureWeight(tempAboveThreshold);
    const tempPercentage = calculateTemperaturePercentage(tempAboveThreshold);

    return blendPercentages(dateBasedPercentage, tempPercentage, tempWeight);
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
      closestReference.spring.month - 1,
      closestReference.spring.day
    ),
    end: new Date(
      year,
      closestReference.fall.month - 1,
      closestReference.fall.day
    )
  };
};
