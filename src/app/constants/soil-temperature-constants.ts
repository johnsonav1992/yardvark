/**
 * Reference data for lawn season dates based on latitude.
 *
 * Each entry contains:
 * - lat: Latitude in degrees north
 * - spring: Object containing the approximate start date of the spring lawn season
 *   - month: Month number (1-12)
 *   - day: Day of month
 * - fall: Object containing the approximate end date of the lawn season
 *   - month: Month number (1-12)
 *   - day: Day of month
 *
 * This data can be used to determine optimal lawn care timing based on geographical location.
 */
export const lawnSeasonDatesAndTemperaturesReference = [
  {
    lat: 30,
    spring: { month: 2, day: 15 }, // Deep South - soil hits 50°F mid-late Feb
    fall: { month: 11, day: 20 } // Stays warm through late Nov
  },
  {
    lat: 35,
    spring: { month: 2, day: 28 }, // Texas/Oklahoma - soil hits 50°F late Feb/early March
    fall: { month: 11, day: 5 } // Typically goes dormant early Nov
  },
  {
    lat: 40,
    spring: { month: 3, day: 20 }, // Mid-Atlantic - soil hits 50°F late March
    fall: { month: 10, day: 20 } // Goes dormant late Oct
  },
  {
    lat: 45,
    spring: { month: 4, day: 10 }, // Northern states - soil hits 50°F mid-April
    fall: { month: 10, day: 5 } // Goes dormant early Oct
  },
  {
    lat: 50,
    spring: { month: 4, day: 25 }, // Canadian border - soil hits 50°F late April
    fall: { month: 9, day: 20 } // Goes dormant late Sept
  }
];
