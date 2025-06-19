import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LawnSegment } from '../types/lawnSegments.types';
import { apiUrl, deleteReq, postReq, putReq } from '../utils/httpUtils';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class LawnSegmentsService {
	public lawnSegments = httpResource<LawnSegment[]>(() =>
		apiUrl('lawn-segments'),
	);

	public addLawnSegment(newSegment: LawnSegment): Observable<LawnSegment> {
		return postReq<LawnSegment>(apiUrl('lawn-segments'), {
			name: newSegment.name,
			size: newSegment.size,
		} satisfies Pick<LawnSegment, 'name' | 'size'>);
	}

	public updateLawnSegment(segment: LawnSegment): Observable<LawnSegment> {
		return putReq<LawnSegment>(
			apiUrl('lawn-segments', { params: [segment.id] }),
			segment,
		);
	}

	public deleteLawnSegment(id: number): Observable<void> {
		return deleteReq(apiUrl(`lawn-segments`, { params: [id] }));
	}
}
