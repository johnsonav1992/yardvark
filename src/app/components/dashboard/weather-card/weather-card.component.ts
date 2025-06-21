import { Component, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { WeatherService } from '../../../services/weather-service';
import { GlobalUiService } from '../../../services/global-ui.service';
import { LocationService } from '../../../services/location.service';
import {
  convertPeriodToForecast,
  getForecastMarkerIcon
} from '../../../utils/weatherUtils';
import { LoadingSpinnerComponent } from '../../miscellanious/loading-spinner/loading-spinner.component';
import type { WeatherPeriod } from '../../../types/weather.types';

@Component({
  selector: 'weather-card',
  imports: [CardModule, LoadingSpinnerComponent],
  templateUrl: './weather-card.component.html',
  styleUrl: './weather-card.component.scss'
})
export class WeatherCardComponent {
  private _weatherService = inject(WeatherService);
  private _globalUiService = inject(GlobalUiService);
  private _locationService = inject(LocationService);

  public isMobile = this._globalUiService.isMobile;
  public isDarkMode = this._globalUiService.isDarkMode;
  public userCoords = this._locationService.userLatLong;
  public weatherData = this._weatherService.weatherForecastData;

  public hasLocation = computed(() => !!this.userCoords());

  public isLoading = computed(() =>
    this._weatherService.weatherDataResource.isLoading()
  );

  public todaysWeather = computed(() => {
    const forecasts = this.weatherData();
    if (!forecasts || forecasts.length === 0) return null;

    const todayDateString = this.getTodayDateString();

    const todayDaytimeForecast = this.findPeriodByDate({
      forecasts,
      dateString: todayDateString,
      isDaytime: true
    });

    if (todayDaytimeForecast) return todayDaytimeForecast;

    const todayNighttimeForecast = this.findPeriodByDate({
      forecasts,
      dateString: todayDateString,
      isDaytime: false
    });

    if (todayNighttimeForecast) return todayNighttimeForecast;

    return forecasts.find((period) => period.isDaytime) || forecasts[0];
  });

  public tonightsWeather = computed(() => {
    const forecasts = this.weatherData();
    if (!forecasts || forecasts.length === 0) return null;

    const todayDateString = this.getTodayDateString();
    const mainWeather = this.todaysWeather();

    const tonightForecast = this.findPeriodByDate({
      forecasts,
      dateString: todayDateString,
      isDaytime: false
    });

    if (
      tonightForecast &&
      mainWeather &&
      tonightForecast.startTime !== mainWeather.startTime
    ) {
      return tonightForecast;
    }

    return null;
  });

  public todaysWeatherIcon = computed(() =>
    this.getWeatherIconForPeriod(this.todaysWeather())
  );

  public tonightsWeatherIcon = computed(() =>
    this.getWeatherIconForPeriod(this.tonightsWeather())
  );

  private getWeatherIconForPeriod(period: WeatherPeriod | null): string {
    if (!period) return 'ti ti-cloud';

    return getForecastMarkerIcon(convertPeriodToForecast(period));
  }

  private findPeriodByDate({
    forecasts,
    dateString,
    isDaytime
  }: {
    forecasts: WeatherPeriod[];
    dateString: string;
    isDaytime?: boolean;
  }): WeatherPeriod | undefined {
    return forecasts.find((period) => {
      const periodDate = new Date(period.startTime);
      const matchesDate = periodDate.toDateString() === dateString;
      const matchesDayTime =
        isDaytime === undefined || period.isDaytime === isDaytime;

      return matchesDate && matchesDayTime;
    });
  }

  private getTodayDateString(): string {
    return new Date().toDateString();
  }
}
