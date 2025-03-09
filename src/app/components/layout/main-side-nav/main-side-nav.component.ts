import { Component, ViewEncapsulation } from '@angular/core';
import { MenuDesignTokens } from '@primeng/themes/types/menu';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'main-side-nav',
  imports: [DrawerModule, MenuModule],
  templateUrl: './main-side-nav.component.html',
  styleUrl: './main-side-nav.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MainSideNavComponent {
  public menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'ti ti-dashboard',
      routerLink: '/',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Entry Log',
      icon: 'ti ti-calendar',
      routerLink: '/entry-log',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Soil data',
      icon: 'ti ti-shovel',
      routerLink: '/soil-data',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'products',
      icon: 'ti ti-garden-cart',
      routerLink: '/products',
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
