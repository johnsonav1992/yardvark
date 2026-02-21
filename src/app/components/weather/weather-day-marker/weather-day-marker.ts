import { Component, inject, input } from "@angular/core";
import { Popover, PopoverModule } from "primeng/popover";
import { GlobalUiService } from "../../../services/global-ui.service";
import { CalendarMarkerData } from "../../entries/entries-calendar/entries-calendar.component";
import { DailyWeatherCalendarForecast } from "../../../types/weather.types";

@Component({
	selector: "weather-day-marker",
	imports: [PopoverModule],
	templateUrl: "./weather-day-marker.html",
	styleUrl: "./weather-day-marker.scss",
})
export class WeatherDayMarker {
	private _globalUiService = inject(GlobalUiService);
	public marker =
		input.required<
			CalendarMarkerData<{
				forecast: DailyWeatherCalendarForecast;
			}>
		>();

	public isMobile = this._globalUiService.isMobile;
	public isDarkMode = this._globalUiService.isDarkMode;

	public onIconClick(event: Event, popover: Popover): void {
		event.stopPropagation();

		if (this.isMobile()) popover.toggle(event);
	}

	public onMouseEnter(event: Event, popover: Popover): void {
		if (!this.isMobile()) popover.show(event);
	}

	public onMouseLeave(popover: Popover): void {
		if (!this.isMobile()) popover.hide();
	}
}
