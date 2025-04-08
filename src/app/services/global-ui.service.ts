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

  constructor() {
    this.initializeDarkMode();
  }

  public toggleDarkMode() {
    this.isDarkMode.update((prevMode) => !prevMode);

    document.querySelector('html')?.classList.toggle(YV_DARK_MODE_SELECTOR);

    if (this.isDarkMode()) {
      localStorage.setItem(YV_DARK_MODE_SELECTOR, 'true');
    } else {
      localStorage.removeItem(YV_DARK_MODE_SELECTOR);
    }
  }

  public initializeDarkMode() {
    const darkMode = localStorage.getItem(YV_DARK_MODE_SELECTOR);

    if (darkMode) {
      this.isDarkMode.set(true);
      document.querySelector('html')?.classList.add(YV_DARK_MODE_SELECTOR);
    }
  }
}
