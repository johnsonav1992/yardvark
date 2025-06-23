import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { MenuDesignTokens } from '@primeng/themes/types/menu';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { GlobalUiService } from '../../../services/global-ui.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'main-side-nav',
  imports: [DrawerModule, MenuModule, ToggleSwitchModule, FormsModule],
  templateUrl: './main-side-nav.component.html',
  styleUrl: './main-side-nav.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MainSideNavComponent {
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;
  public isDarkMode = this._globalUiService.isDarkMode;

  public isMobileSidebarOpen = this._globalUiService.isMobileSidebarOpen;

  public closeSidebar = () => {
    this.isMobileSidebarOpen.set(false);
  };

  public toggleDarkMode = () => {
    this._globalUiService.toggleDarkMode();
  };

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
      command: this.closeSidebar
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
    },
    {
      label: 'Analytics',
      icon: 'ti ti-chart-dots',
      routerLink: '/analytics',
      command: this.closeSidebar,
      routerLinkActiveOptions: { exact: true }
    }
    // {
    //   label: 'Calculators',
    //   icon: 'ti ti-calculator',
    //   routerLink: '/calculators',
    //   command: this.closeSidebar,
    //   routerLinkActiveOptions: { exact: true }
    // }
  ];

  public menuDt = computed<MenuDesignTokens>(() => ({
    root: {
      borderColor: 'transparent'
    },
    list: {
      gap: '.5rem'
    },
    item: {
      color: this.isDarkMode() ? '{surface.200}' : '{surface.500}',
      icon: {
        color: this.isDarkMode() ? '{surface.200}' : '{surface.500}'
      }
    }
  }));
}
