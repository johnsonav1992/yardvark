import {
  eachDayOfInterval,
  endOfMonth,
  getDay,
  isSameDay,
  isToday,
  startOfMonth
} from 'date-fns';
import { CalendarMarkerData } from './calendar.component';

export const getCalendarDaysData = (
  currentDate: Date,
  markers: CalendarMarkerData<any>[]
) => {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const firstDayOfWeek = getDay(start);

  return eachDayOfInterval({ start, end }).map((date, index) => ({
    date,
    gridColumnStart: index === 0 ? firstDayOfWeek + 1 : undefined,
    markers: getMarkersForDate(date, markers),
    isToday: isToday(date)
  }));
};

export const getMarkersForDate = (
  date: Date,
  markers: CalendarMarkerData<any>[]
): CalendarMarkerData[] => {
  return markers.filter((marker) => isSameDay(marker.date, date));
};
