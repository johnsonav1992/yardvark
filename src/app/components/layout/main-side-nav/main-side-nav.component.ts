import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { MenuDesignTokens } from '@primeuix/themes/types/menu';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { GlobalUiService } from '../../../services/global-ui.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { FeedbackDialogComponent } from '../../feedback/feedback-dialog/feedback-dialog.component';
import { NAV_ITEMS } from '../../../config/navigation.config';

@Component({
  selector: 'main-side-nav',
  imports: [DrawerModule, MenuModule, ToggleSwitchModule, FormsModule, ButtonModule],
  providers: [DialogService],
  templateUrl: './main-side-nav.component.html',
  styleUrl: './main-side-nav.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MainSideNavComponent {
  private _globalUiService = inject(GlobalUiService);
  private _dialogService = inject(DialogService);

  public isMobile = this._globalUiService.isMobile;
  public isDarkMode = this._globalUiService.isDarkMode;

  public isMobileSidebarOpen = this._globalUiService.isMobileSidebarOpen;

  public closeSidebar = () => {
    this.isMobileSidebarOpen.set(false);
  };

  public toggleDarkMode = () => {
    this._globalUiService.toggleDarkMode();
  };

  public openFeedbackDialog = () => {
    this.closeSidebar();

    const dialogRef = this._dialogService.open(FeedbackDialogComponent, {
      header: 'Send Feedback',
      modal: true,
      focusOnShow: false,
      width: this.isMobile() ? '90%' : '500px',
      height: 'auto'
    });

    dialogRef?.onClose.subscribe();
  };

  public menuItems: MenuItem[] = NAV_ITEMS.map(item => ({
    ...item,
    command: this.closeSidebar
  }));

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
