import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { GlobalUiService } from '../../../services/global-ui.service';
import { SettingsService } from '../../../services/settings.service';
import { DialogService } from 'primeng/dynamicdialog';
import { FeedbackDialogComponent } from '../../feedback/feedback-dialog/feedback-dialog.component';
import { NavbarCustomizationDialogComponent } from '../navbar-customization-dialog/navbar-customization-dialog.component';
import { MenuDesignTokens } from '@primeng/themes/types/menu';

interface NavItem extends MenuItem {
  id: string;
}

const DEFAULT_NAV_ITEMS = ['dashboard', 'entry-log', 'products', 'analytics'];

@Component({
  selector: 'mobile-bottom-navbar',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DrawerModule,
    MenuModule,
    ToggleSwitchModule,
    FormsModule
  ],
  providers: [DialogService],
  templateUrl: './mobile-bottom-navbar.component.html',
  styleUrl: './mobile-bottom-navbar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MobileBottomNavbarComponent {
  private _globalUiService = inject(GlobalUiService);
  private _settingsService = inject(SettingsService);
  private _dialogService = inject(DialogService);

  public isDarkMode = this._globalUiService.isDarkMode;
  public isMoreMenuOpen = signal(false);

  private selectedItemIds = computed(() => {
    const settings = this._settingsService.currentSettings();
    return settings?.mobileNavbarItems?.length === 4
      ? settings.mobileNavbarItems
      : DEFAULT_NAV_ITEMS;
  });

  public allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'ti ti-dashboard',
      routerLink: '/dashboard',
      routerLinkActiveOptions: { exact: true }
    },
    {
      id: 'entry-log',
      label: 'Entry Log',
      icon: 'ti ti-calendar',
      routerLink: '/entry-log'
    },
    {
      id: 'soil-data',
      label: 'Soil data',
      icon: 'ti ti-shovel',
      routerLink: '/soil-data',
      routerLinkActiveOptions: { exact: true }
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'ti ti-packages',
      routerLink: '/products',
      routerLinkActiveOptions: { exact: true }
    },
    {
      id: 'equipment',
      label: 'Equipment',
      icon: 'ti ti-assembly',
      routerLink: '/equipment',
      routerLinkActiveOptions: { exact: true }
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'ti ti-chart-dots',
      routerLink: '/analytics',
      routerLinkActiveOptions: { exact: true }
    },
    {
      id: 'calculators',
      label: 'Calculators',
      icon: 'ti ti-calculator',
      routerLink: '/calculators',
      routerLinkActiveOptions: { exact: true }
    }
  ];

  public primaryNavItems = computed(() => {
    const selectedIds = this.selectedItemIds();
    const items = selectedIds
      .map(id => this.allNavItems.find(item => item.id === id))
      .filter((item): item is NavItem => item !== undefined);

    items.push({
      id: 'more',
      label: 'More',
      icon: 'ti ti-menu-2',
      command: () => this.toggleMoreMenu()
    });

    return items;
  });

  public moreMenuItems = computed<MenuItem[]>(() => {
    const selectedIds = this.selectedItemIds();
    return this.allNavItems
      .filter(item => !selectedIds.includes(item.id))
      .map(item => ({
        ...item,
        command: () => this.closeMoreMenu()
      }));
  });

  public toggleMoreMenu = () => {
    this.isMoreMenuOpen.update(prev => !prev);
  };

  public handleMoreClick = (event: Event) => {
    event.preventDefault();
    this.toggleMoreMenu();
  };

  public closeMoreMenu = () => {
    this.isMoreMenuOpen.set(false);
  };

  public toggleDarkMode = () => {
    this._globalUiService.toggleDarkMode();
  };

  public openFeedbackDialog = () => {
    this.closeMoreMenu();

    const dialogRef = this._dialogService.open(FeedbackDialogComponent, {
      header: 'Send Feedback',
      modal: true,
      focusOnShow: false,
      width: '90%',
      height: 'auto'
    });

    dialogRef.onClose.subscribe();
  };

  public openCustomizationDialog = () => {
    this.closeMoreMenu();

    const dialogRef = this._dialogService.open(NavbarCustomizationDialogComponent, {
      header: 'Customize Navigation Bar',
      modal: true,
      focusOnShow: false,
      width: '90%',
      height: 'auto'
    });

    dialogRef.onClose.subscribe();
  };

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
