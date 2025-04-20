import { httpResource } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import { EntriesSearchRequest, Entry } from '../types/entries.types';
import { apiUrl, deleteReq, postReq } from '../utils/httpUtils';
import { endOfMonth, startOfMonth } from 'date-fns';
import { formatDate } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntriesService {
  public getEntryResource = (
    shouldFetchEntry: Signal<boolean>,
    entryId: Signal<number | undefined>
  ) =>
    httpResource<Entry>(() =>
      shouldFetchEntry() && entryId()
        ? apiUrl('entries/single', { params: [entryId()!] })
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

  public deleteEntry(entryId: number): Observable<void> {
    return deleteReq(apiUrl('entries', { params: [entryId] }));
  }

  public searchEntries(
    searchCriteria: EntriesSearchRequest
  ): Observable<Entry[]> {
    return postReq<Entry[], EntriesSearchRequest>(
      apiUrl('entries/search'),
      searchCriteria
    );
  }
}
