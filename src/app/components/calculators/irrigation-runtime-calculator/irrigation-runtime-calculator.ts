import { Component, computed, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { PopoverModule } from "primeng/popover";
import { TooltipModule } from "primeng/tooltip";
import { getIrrigationRuntimeMinutes } from "../../../utils/lawnCalculatorUtils";

type ZoneInput = {
	id: number;
	name: string;
	precipRateInput: string;
};

type ZoneRuntimeResult = {
	id: number;
	name: string;
	precipRate: number;
	minutesPerWeek: number;
	minutesPerDay: number;
	isEstimated: boolean;
};

@Component({
	selector: "irrigation-runtime-calculator",
	imports: [
		CardModule,
		InputTextModule,
		ButtonModule,
		PopoverModule,
		TooltipModule,
	],
	templateUrl: "./irrigation-runtime-calculator.html",
	styleUrl: "./irrigation-runtime-calculator.scss",
})
export class IrrigationRuntimeCalculator {
	private _zoneIdCounter = 2;

	public targetWeeklyWaterInput = signal("1");
	public rainfallThisWeekInput = signal("0");
	public wateringDaysPerWeekInput = signal("3");
	public estimatedPrecipRateInput = signal("0.5");
	public isCalibrationExpanded = signal(false);
	public calibrationRuntimeMinutesInput = signal("10");
	public calibrationDepthInchesInput = signal("");
	public zones = signal<ZoneInput[]>([
		{
			id: 1,
			name: "Zone 1",
			precipRateInput: "",
		},
	]);

	public effectiveTargetWeeklyWaterInches = computed(
		() => this.parseNumber(this.targetWeeklyWaterInput()) ?? 0,
	);
	public effectiveRainfallThisWeekInches = computed(
		() => this.parseNumber(this.rainfallThisWeekInput()) ?? 0,
	);
	public effectiveWateringDaysPerWeek = computed(
		() => this.parseNumber(this.wateringDaysPerWeekInput()) ?? 0,
	);
	public effectiveEstimatedPrecipRate = computed(
		() => this.parseNumber(this.estimatedPrecipRateInput()) ?? 0,
	);

	public remainingIrrigationInches = computed(() =>
		Math.max(
			this.effectiveTargetWeeklyWaterInches() -
				this.effectiveRainfallThisWeekInches(),
			0,
		),
	);

	public hasValidScheduleInputs = computed(
		() =>
			this.effectiveTargetWeeklyWaterInches() >= 0 &&
			this.effectiveRainfallThisWeekInches() >= 0 &&
			this.effectiveWateringDaysPerWeek() > 0,
	);

	public zoneRuntimeResults = computed<ZoneRuntimeResult[]>(() => {
		if (!this.hasValidScheduleInputs()) return [];

		const remainingInches = this.remainingIrrigationInches();
		const wateringDays = this.effectiveWateringDaysPerWeek();

		return this.zones()
			.map((zone) => {
				const explicitRate = this.parseNumber(zone.precipRateInput);
				const fallbackRate = this.effectiveEstimatedPrecipRate();
				const precipRate =
					explicitRate && explicitRate > 0 ? explicitRate : fallbackRate;

				if (!precipRate || precipRate <= 0) return null;

				const minutesPerWeek = getIrrigationRuntimeMinutes({
					targetDepthInches: remainingInches,
					precipitationRateInchesPerHour: precipRate,
				});

				if (minutesPerWeek === null) return null;

				return {
					id: zone.id,
					name: zone.name || `Zone ${zone.id}`,
					precipRate,
					minutesPerWeek,
					minutesPerDay: Math.round(minutesPerWeek / wateringDays),
					isEstimated: !explicitRate || explicitRate <= 0,
				};
			})
			.filter((zone): zone is ZoneRuntimeResult => zone !== null);
	});

	public totalWeeklyMinutes = computed(() =>
		this.zoneRuntimeResults().reduce(
			(total, zone) => total + zone.minutesPerWeek,
			0,
		),
	);

	public rainfallMeetsTarget = computed(
		() =>
			this.effectiveRainfallThisWeekInches() >=
			this.effectiveTargetWeeklyWaterInches(),
	);
	public estimatedZonesCount = computed(
		() => this.zoneRuntimeResults().filter((zone) => zone.isEstimated).length,
	);
	public hasEstimatedZones = computed(() => this.estimatedZonesCount() > 0);
	public canUseCalibration = computed(() => {
		const depth = this.parseNumber(this.calibrationDepthInchesInput());
		const runtime = this.parseNumber(this.calibrationRuntimeMinutesInput());
		return depth !== null && runtime !== null && depth > 0 && runtime > 0;
	});
	public calibratedRate = computed(() => {
		if (!this.canUseCalibration()) return null;
		const depth = this.parseNumber(this.calibrationDepthInchesInput()) ?? 0;
		const runtime =
			this.parseNumber(this.calibrationRuntimeMinutesInput()) ?? 1;
		return Number(((depth * 60) / runtime).toFixed(2));
	});

	public shouldShowResults = computed(
		() => this.hasValidScheduleInputs() && this.zoneRuntimeResults().length > 0,
	);

	public shouldShowZoneHint = computed(
		() =>
			this.hasValidScheduleInputs() &&
			this.remainingIrrigationInches() > 0 &&
			this.zoneRuntimeResults().length === 0,
	);

	private parseNumber(value: string | number | null): number | null {
		if (value === null || value === undefined || value === "") return null;
		if (typeof value === "number") return value;

		const normalized = value.trim().startsWith(".")
			? `0${value.trim()}`
			: value.trim();
		const parsed = Number.parseFloat(normalized);

		return Number.isNaN(parsed) ? null : parsed;
	}

	public onTargetWeeklyWaterChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.targetWeeklyWaterInput.set(value);
	}

	public onRainfallThisWeekChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.rainfallThisWeekInput.set(value);
	}

	public onWateringDaysChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.wateringDaysPerWeekInput.set(value);
	}

	public onEstimatedRateChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.estimatedPrecipRateInput.set(value);
	}

	public onCalibrationRuntimeChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.calibrationRuntimeMinutesInput.set(value);
	}

	public onCalibrationDepthChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.calibrationDepthInchesInput.set(value);
	}

	public applyCalibratedRate(): void {
		const rate = this.calibratedRate();
		if (!rate || rate <= 0) return;
		this.estimatedPrecipRateInput.set(`${rate}`);
	}

	public toggleCalibration(): void {
		this.isCalibrationExpanded.update((isExpanded) => !isExpanded);
	}

	public onZoneNameChange(zoneId: number, event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.zones.update((zones) =>
			zones.map((zone) =>
				zone.id === zoneId ? { ...zone, name: value } : zone,
			),
		);
	}

	public onZoneRateChange(zoneId: number, event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.zones.update((zones) =>
			zones.map((zone) =>
				zone.id === zoneId ? { ...zone, precipRateInput: value } : zone,
			),
		);
	}

	public addZone(): void {
		const nextId = this._zoneIdCounter++;
		this.zones.update((zones) => [
			...zones,
			{ id: nextId, name: `Zone ${nextId}`, precipRateInput: "" },
		]);
	}

	public removeZone(zoneId: number): void {
		this.zones.update((zones) =>
			zones.length === 1 ? zones : zones.filter((zone) => zone.id !== zoneId),
		);
	}
}
