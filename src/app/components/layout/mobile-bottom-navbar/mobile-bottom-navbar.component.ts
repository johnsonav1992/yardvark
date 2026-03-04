import { CommonModule } from "@angular/common";
import {
	Component,
	computed,
	effect,
	inject,
	signal,
	ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { SplashScreen } from "@capacitor/splash-screen";
import type { MenuDesignTokens } from "@primeuix/themes/types/menu";
import type { MenuItem } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DrawerModule } from "primeng/drawer";
import { DialogService } from "primeng/dynamicdialog";
import { MenuModule } from "primeng/menu";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import {
	DEFAULT_MOBILE_NAV_ITEMS,
	NAV_ITEMS,
	type NavItem,
} from "../../../config/navigation.config";
import { GlobalUiService } from "../../../services/global-ui.service";
import { SettingsService } from "../../../services/settings.service";
import { FeedbackDialogComponent } from "../../feedback/feedback-dialog/feedback-dialog.component";
import { NavbarCustomizationDialogComponent } from "../navbar-customization-dialog/navbar-customization-dialog.component";

@Component({
	selector: "mobile-bottom-navbar",
	imports: [
		CommonModule,
		RouterModule,
		ButtonModule,
		DrawerModule,
		MenuModule,
		ToggleSwitchModule,
		FormsModule,
	],
	providers: [DialogService],
	templateUrl: "./mobile-bottom-navbar.component.html",
	styleUrl: "./mobile-bottom-navbar.component.scss",
	encapsulation: ViewEncapsulation.None,
})
export class MobileBottomNavbarComponent {
	private _globalUiService = inject(GlobalUiService);
	private _settingsService = inject(SettingsService);
	private _dialogService = inject(DialogService);
	private _router = inject(Router);

	public isDarkMode = this._globalUiService.isDarkMode;
	public isMoreMenuOpen = signal(false);

	public isSettingsLoaded = computed(() => {
		return !this._settingsService.settings.isLoading();
	});

	private selectedItemIds = computed<string[]>(() => {
		const settings = this._settingsService.currentSettings();
		const items = settings?.mobileNavbarItems;
		return items && items.length >= 4 && items.length <= 5
			? items
			: DEFAULT_MOBILE_NAV_ITEMS;
	});

	public allNavItems = NAV_ITEMS;

	public shouldUseShortLabels = computed(() => {
		return this.selectedItemIds().length === 5;
	});

	public primaryNavItems = computed(() => {
		const selectedIds = this.selectedItemIds();
		const useShortLabels = this.shouldUseShortLabels();

		const items: NavItem[] = selectedIds
			.map((id) => this.allNavItems.find((item) => item.id === id))
			.filter((item) => item !== undefined)
			.map((item) => ({
				...item,
				label: useShortLabels && item.shortLabel ? item.shortLabel : item.label,
			}));

		items.push({
			id: "more",
			label: "More",
			icon: "ti ti-menu-2",
			command: () => this.toggleMoreMenu(),
			routerLinkActiveOptions: { exact: false },
		});

		return items;
	});

	public moreMenuItems = computed<MenuItem[]>(() => {
		const selectedIds = this.selectedItemIds();
		return this.allNavItems
			.filter((item) => !selectedIds.includes(item.id))
			.map((item) => ({
				...item,
				command: () => this.closeMoreMenu(),
			}));
	});

	private readonly splashScreenWatcher = effect(() => {
		const isSettingsLoaded = this.isSettingsLoaded();

		if (isSettingsLoaded) {
			SplashScreen.hide();
			this.splashScreenWatcher.destroy(); // Stop watching after hiding the splash screen
		}
	});

	public toggleMoreMenu = () => {
		this.isMoreMenuOpen.update((prev) => !prev);
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
			header: "Send Feedback",
			modal: true,
			focusOnShow: false,
			width: "90%",
			height: "auto",
		});

		dialogRef?.onClose.subscribe();
	};

	public openCustomizationDialog = () => {
		this.closeMoreMenu();

		const dialogRef = this._dialogService.open(
			NavbarCustomizationDialogComponent,
			{
				header: "Customize Navigation Bar",
				modal: true,
				focusOnShow: false,
				width: "90%",
				height: "auto",
			},
		);

		dialogRef?.onClose.subscribe();
	};

	public goToSubscription = () => {
		this.closeMoreMenu();
		this._router.navigate(["/subscription"]);
	};

	public menuDt = computed<MenuDesignTokens>(() => ({
		root: {
			borderColor: "transparent",
		},
		list: {
			gap: ".5rem",
		},
		item: {
			color: this.isDarkMode() ? "{surface.200}" : "{surface.500}",
			icon: {
				color: this.isDarkMode() ? "{surface.200}" : "{surface.500}",
			},
		},
	}));
}
