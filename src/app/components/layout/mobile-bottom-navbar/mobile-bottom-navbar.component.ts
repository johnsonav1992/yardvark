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
import { BottomNavbarPreferencesService } from '../../../services/bottom-navbar-preferences.service';
import { DialogService } from 'primeng/dynamicdialog';
import { FeedbackDialogComponent } from '../../feedback/feedback-dialog/feedback-dialog.component';
import { NavbarCustomizationDialogComponent } from '../navbar-customization-dialog/navbar-customization-dialog.component';
import { MenuDesignTokens } from '@primeng/themes/types/menu';

interface NavItem extends MenuItem {
  id: string;
}

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
  private _preferencesService = inject(BottomNavbarPreferencesService);
  private _dialogService = inject(DialogService);

  public isDarkMode = this._globalUiService.isDarkMode;
  public isMoreMenuOpen = signal(false);

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
    const selectedIds = this._preferencesService.selectedItemIds();
    return selectedIds
      .map(id => this.allNavItems.find(item => item.id === id))
      .filter((item): item is NavItem => item !== undefined);
  });

  public moreMenuItems = computed<MenuItem[]>(() => {
    const selectedIds = this._preferencesService.selectedItemIds();
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

    dialogRef.onClose.subscribe((result) => {
      if (result) {
        console.log('Feedback sent successfully');
      }
    });
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

    dialogRef.onClose.subscribe((result) => {
      if (result) {
        console.log('Navbar preferences updated');
      }
    });
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
