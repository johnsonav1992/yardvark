import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LawnSegment } from '../types/lawnSegments.types';
import { apiUrl } from '../utils/httpUtils';
import { injectUserData } from '../utils/authUtils';

@Injectable({
  providedIn: 'root'
})
export class LawnSegmentsService {
  public user = injectUserData();
  public lawnSegments = httpResource<LawnSegment[]>(() =>
    this.user()
      ? apiUrl('lawn-segments', { params: [this.user()?.sub!] })
      : undefined
  );
}
