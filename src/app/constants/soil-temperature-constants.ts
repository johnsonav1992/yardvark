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
		spring: { month: 1, day: 28 },
		fall: { month: 9, day: 25 }
	},
	{
		lat: 35,
		spring: { month: 1, day: 15 },
		fall: { month: 9, day: 10 }
	},
	{
		lat: 40,
		spring: { month: 2, day: 10 },
		fall: { month: 8, day: 15 }
	},
	{
		lat: 45,
		spring: { month: 2, day: 25 },
		fall: { month: 7, day: 30 }
	},
	{
		lat: 50,
		spring: { month: 3, day: 10 },
		fall: { month: 7, day: 15 }
	}
];
