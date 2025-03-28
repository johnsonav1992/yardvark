import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LawnSegment } from '../types/lawnSegments.types';
import { apiUrl, postReq } from '../utils/httpUtils';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LawnSegmentsService {
  public lawnSegments = httpResource<LawnSegment[]>(() =>
    apiUrl('lawn-segments')
  );

  public addLawnSegment(newSegment: LawnSegment): Observable<void> {
    return postReq(apiUrl('lawn-segments'), {
      name: newSegment.name,
      size: newSegment.size
    });
  }
}
