import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LawnSegment } from '../types/lawnSegments.types';
import { apiUrl, postReq } from '../utils/httpUtils';
import { LawnSegmentCreationRequest } from '../../../backend/src/lawn-segments/models/lawn-segments.types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LawnSegmentsService {
  public lawnSegments = httpResource<LawnSegment[]>(() =>
    apiUrl('lawn-segments')
  );

  public addLawnSegment(
    newSegment: LawnSegmentCreationRequest
  ): Observable<void> {
    return postReq(apiUrl('lawn-segments'), newSegment);
  }
}
