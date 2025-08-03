import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, timeout, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ai/chat`;

  public sendChatMessage(prompt: string): Observable<string> {
    return this.http.post<ChatResponse>(this.apiUrl, { prompt }).pipe(
      timeout(5000),
      catchError(() => of({ response: '', success: false })),
      map((response) => (response.success ? response.response : ''))
    );
  }
}
