import { httpResource } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import { Entry } from '../types/entries.types';
import { apiUrl } from '../utils/httpUtils';
import { User } from '@auth0/auth0-angular';
import { endOfMonth, startOfMonth } from 'date-fns';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class EntriesService {
  public getEntryResource = (
    shouldFetchEntry: Signal<boolean>,
    entryId: Signal<number>
  ) =>
    httpResource<Entry>(() =>
      shouldFetchEntry() && entryId()
        ? apiUrl('entries/single', { params: [entryId()] })
        : undefined
    );

  public getEntryByDateResource = (date: Signal<Date | null>) =>
    httpResource<Entry>(() =>
      date()
        ? apiUrl('entries/single/by-date', {
            params: [formatDate(date()!, 'MM-dd-yyyy', 'en-US')]
          })
        : undefined
    );

  public getMostRecentEntryResource = () =>
    httpResource<Entry | null>(() => apiUrl('entries/single/most-recent'));

  public getMonthEntriesResource = (currentDate: Signal<Date>) =>
    httpResource<Entry[]>(() =>
      apiUrl('entries', {
        queryParams: {
          startDate: startOfMonth(currentDate()),
          endDate: endOfMonth(currentDate())
        }
      })
    );
}
