import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, timeout, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AiChatResponse } from '../types/ai.types';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ai/chat`;

  public sendChatMessage(prompt: string): Observable<AiChatResponse | null> {
    return this.http.post<AiChatResponse>(this.apiUrl, { prompt }).pipe(
      timeout(5000),
      catchError(() => of(null))
    );
  }

  public sendChatMessageContent(prompt: string): Observable<string> {
    return this.http.post<AiChatResponse>(this.apiUrl, { prompt }).pipe(
      timeout(5000),
      catchError(() => of(null)),
      map((response: AiChatResponse | null) => response?.content || '')
    );
  }
}
