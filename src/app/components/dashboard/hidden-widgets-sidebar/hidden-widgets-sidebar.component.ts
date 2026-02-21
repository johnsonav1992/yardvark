import { Component, inject, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { DrawerModule } from "primeng/drawer";
import { GlobalUiService } from "../../../services/global-ui.service";

export interface HiddenWidget {
	id: string;
	label: string;
}

@Component({
	selector: "hidden-widgets-sidebar",
	imports: [DrawerModule, ButtonModule],
	templateUrl: "./hidden-widgets-sidebar.component.html",
	styleUrl: "./hidden-widgets-sidebar.component.scss",
})
export class HiddenWidgetsSidebarComponent {
	private _globalUiService = inject(GlobalUiService);

	public isMobile = this._globalUiService.isMobile;

	public isOpen = input.required<boolean>();
	public hiddenWidgets = input.required<HiddenWidget[]>();

	public onToggleSidebar = output<boolean>();
	public onShowWidget = output<string>();

	public closeSidebar(): void {
		this.onToggleSidebar.emit(false);
	}

	public showWidget(widgetId: string): void {
		this.onShowWidget.emit(widgetId);
	}
}
