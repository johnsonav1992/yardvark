import { Component, computed, inject } from '@angular/core';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { SoilTempWeekGraphComponent } from '../../components/soil-data/soil-temp-week-graph/soil-temp-week-graph.component';
import { getAllDailyNumericDataAverages } from '../../utils/soilTemperatureUtils';
import { SoilMoistureWeekGraphComponent } from '../../components/soil-data/soil-moisture-week-graph/soil-moisture-week-graph.component';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { LocationService } from '../../services/location.service';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';

@Component({
	selector: 'soil-data',
	imports: [
		SoilTempWeekGraphComponent,
		SoilMoistureWeekGraphComponent,
		PageContainerComponent,
		ButtonModule,
		CardModule,
	],
	templateUrl: './soil-data.component.html',
	styleUrl: './soil-data.component.scss',
})
export class SoilDataComponent {
	private _soilTemperatureService = inject(SoilTemperatureService);
	private _locationService = inject(LocationService);
	private _router = inject(Router);

	public userHasALocation = computed(
		() => !!this._locationService.userLatLong(),
	);

	public dailyAverageShallowTemps = computed(() => {
		const rawTempData =
			this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
				?.hourly.soil_temperature_6cm;

		return getAllDailyNumericDataAverages(rawTempData || []);
	});

	public dailyAverageDeepTemps = computed(() => {
		const rawTempData =
			this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
				?.hourly.soil_temperature_18cm;

		return getAllDailyNumericDataAverages(rawTempData || []);
	});

	public dailyMoistureData = computed(() => {
		const rawMoistureData =
			this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
				?.hourly.soil_moisture_3_to_9cm;

		return getAllDailyNumericDataAverages(rawMoistureData || [], {
			precision: 2,
			multiplicationFactor: 100,
		});
	});

	public isLoadingAveragesChartData = computed(() =>
		this._soilTemperatureService.rollingWeekDailyAverageSoilData.isLoading(),
	);

	public tempUnit = computed(
		() => this._soilTemperatureService.temperatureUnit()!,
	);

	public goToSettings(): void {
		this._router.navigate(['settings']);
	}
}
