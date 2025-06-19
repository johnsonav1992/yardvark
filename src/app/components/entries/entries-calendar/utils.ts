import {
	eachDayOfInterval,
	endOfMonth,
	getDay,
	isSameDay,
	isToday,
	startOfMonth
} from 'date-fns';
import { CalendarMarkerData } from './entries-calendar.component';

export const getCalendarDaysData = (
	currentDate: Date,
	markers: CalendarMarkerData<unknown>[],
	weatherMarkers: CalendarMarkerData<unknown>[] = []
) => {
	const start = startOfMonth(currentDate);
	const end = endOfMonth(currentDate);
	const firstDayOfWeek = getDay(start);

	return eachDayOfInterval({ start, end }).map((date, index) => ({
		date,
		gridColumnStart: index === 0 ? firstDayOfWeek + 1 : undefined,
		markers: getMarkersForDate(date, markers),
		weatherMarkers: getMarkersForDate(date, weatherMarkers),
		isToday: isToday(date)
	}));
};

export const getMarkersForDate = (
	date: Date,
	markers: CalendarMarkerData<unknown>[]
): CalendarMarkerData<unknown>[] => {
	return markers.filter((marker) => isSameDay(marker.date, date));
};
