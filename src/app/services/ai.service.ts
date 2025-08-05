import { Injectable } from '@angular/core';
import { Observable, of, catchError, timeout, map } from 'rxjs';
import { postReq, apiUrl } from '../utils/httpUtils';
import { AiChatResponse } from '../types/ai.types';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  public sendChatMessage(prompt: string): Observable<AiChatResponse | null> {
    return postReq<AiChatResponse>(apiUrl('ai/chat'), { prompt }).pipe(
      timeout(5000),
      catchError(() => of(null))
    );
  }

  public sendChatMessageContent(prompt: string): Observable<string> {
    return postReq<AiChatResponse>(apiUrl('ai/chat'), { prompt }).pipe(
      timeout(5000),
      catchError(() => of(null)),
      map((response: AiChatResponse | null) => response?.content || '')
    );
  }
}
