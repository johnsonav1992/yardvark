import { Injectable, signal } from '@angular/core';
import { injectBreakpointObserver } from '../utils/styleUtils';
import { SM_BREAKPOINT } from '../constants/style-constants';

@Injectable({
  providedIn: 'root'
})
export class GlobalUiService {
  public isMobileSidebarOpen = signal(false);

  public isMobile = injectBreakpointObserver(`(max-width: ${SM_BREAKPOINT})`);
}
