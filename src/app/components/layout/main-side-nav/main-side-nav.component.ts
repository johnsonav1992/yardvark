import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MenuDesignTokens } from '@primeng/themes/types/menu';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { injectBreakpointObserver } from '../../../utils/styleUtils';
import { SM_BREAKPOINT } from '../../../constants/style-constants';
import { GlobalUiService } from '../../../services/global-ui.service';

@Component({
  selector: 'main-side-nav',
  imports: [DrawerModule, MenuModule],
  templateUrl: './main-side-nav.component.html',
  styleUrl: './main-side-nav.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MainSideNavComponent {
  private _globalUiService = inject(GlobalUiService);

  public isSmallScreen = injectBreakpointObserver(
    `(max-width: ${SM_BREAKPOINT})`
  );

  public isMobileSidebarOpen = this._globalUiService.isMobileSidebarOpen;

  public closeSidebar = () => this.isMobileSidebarOpen.set(false);

  public menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'ti ti-dashboard',
      routerLink: '/dashboard',
      command: this.closeSidebar,
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Entry Log',
      icon: 'ti ti-calendar',
      routerLink: '/entry-log',
      command: this.closeSidebar,
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Soil data',
      icon: 'ti ti-shovel',
      routerLink: '/soil-data',
      command: this.closeSidebar,
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Products',
      icon: 'ti ti-packages',
      routerLink: '/products',
      command: this.closeSidebar,
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Equipment',
      icon: 'ti ti-assembly',
      routerLink: '/equipment',
      command: this.closeSidebar,
      routerLinkActiveOptions: { exact: true }
    }
  ];

  public menuDt: MenuDesignTokens = {
    root: {
      borderColor: 'transparent'
    },
    list: {
      gap: '.5rem'
    },
    item: {
      color: '{surface.500}',
      icon: {
        color: '{surface.500}'
      }
    }
  };
}
