import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LawnSegment } from '../types/lawnSegments.types';
import { apiUrl } from '../utils/httpUtils';

@Injectable({
  providedIn: 'root'
})
export class LawnSegmentsService {
  public lawnSegments = httpResource<LawnSegment[]>(() =>
    apiUrl('lawn-segments')
  );
}
