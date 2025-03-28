import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalUiService {
  public isMobileSidebarOpen = signal(false);
}
