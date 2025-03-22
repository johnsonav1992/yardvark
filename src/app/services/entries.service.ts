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

  public getEntryByDateResource = (
    user: Signal<User | null | undefined>,
    date: Signal<Date | null>
  ) =>
    httpResource<Entry>(() =>
      user()?.sub && date()
        ? apiUrl('entries/single/by-date', {
            params: [user()!.sub!, formatDate(date()!, 'MM-dd-yyyy', 'en-US')]
          })
        : undefined
    );

  public getMostRecentEntryResource = (user: Signal<User | null | undefined>) =>
    httpResource<Entry | null>(
      () =>
        user()?.sub
          ? apiUrl('entries/single/most-recent', { params: [user()!.sub!] })
          : undefined,
      { parse: () => null }
    );

  public getMonthEntriesResource = (
    user: Signal<User | null | undefined>,
    currentDate: Signal<Date>
  ) =>
    httpResource<Entry[]>(() =>
      user()
        ? apiUrl('entries', {
            params: [user()!.sub || ''],
            queryParams: {
              startDate: startOfMonth(currentDate()),
              endDate: endOfMonth(currentDate())
            }
          })
        : undefined
    );
}
