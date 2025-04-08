import { Injectable, signal } from '@angular/core';
import { injectBreakpointObserver } from '../utils/styleUtils';
import {
  SM_BREAKPOINT,
  YV_DARK_MODE_SELECTOR
} from '../constants/style-constants';

@Injectable({
  providedIn: 'root'
})
export class GlobalUiService {
  public isMobileSidebarOpen = signal(false);
  public isDarkMode = signal(false);

  public isMobile = injectBreakpointObserver(`(max-width: ${SM_BREAKPOINT})`);

  public toggleDarkMode() {
    this.isDarkMode.update((prevMode) => !prevMode);

    const htmlEl = document.querySelector('html');
    htmlEl?.classList.toggle(YV_DARK_MODE_SELECTOR);
  }
}
