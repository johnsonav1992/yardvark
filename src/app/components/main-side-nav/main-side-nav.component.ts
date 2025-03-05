import { Component } from '@angular/core';
import { MenuDesignTokens } from '@primeng/themes/types/menu';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'main-side-nav',
  imports: [DrawerModule, MenuModule],
  templateUrl: './main-side-nav.component.html',
  styleUrl: './main-side-nav.component.scss',
})
export class MainSideNavComponent {
  public menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'ti ti-dashboard',
      routerLink: '',
    },
    {
      label: 'Entry Log',
      icon: 'ti ti-calendar',
      routerLink: '/entry-log',
    },
    {
      label: 'Soil data',
      icon: 'ti ti-shovel',
      routerLink: '/soil-data',
    },
  ];

  public menuDt: MenuDesignTokens = {
    root: {
      borderColor: 'transparent',
    },
    list: {
      gap: '.5rem',
    },
    item: {
      color: '{surface.500}',
      focusBackground: '{lime.100}',
      focusColor: '{lime.600}',
      icon: {
        focusColor: '{lime.600}',
      },
    },
  };
}
