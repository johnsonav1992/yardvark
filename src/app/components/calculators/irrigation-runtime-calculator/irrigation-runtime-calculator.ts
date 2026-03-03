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
	precipRate: number | null;
};

type ZoneRuntimeResult = {
	id: number;
	name: string;
	precipRate: number;
	minutesPerWeek: number;
	minutesPerDay: number;
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

	public targetWeeklyWaterInches = signal<number | null>(1);
	public rainfallThisWeekInches = signal<number | null>(0);
	public wateringDaysPerWeek = signal<number | null>(3);
	public zones = signal<ZoneInput[]>([
		{
			id: 1,
			name: "Zone 1",
			precipRate: null,
		},
	]);

	public effectiveTargetWeeklyWaterInches = computed(
		() => this.targetWeeklyWaterInches() ?? 0,
	);
	public effectiveRainfallThisWeekInches = computed(
		() => this.rainfallThisWeekInches() ?? 0,
	);
	public effectiveWateringDaysPerWeek = computed(
		() => this.wateringDaysPerWeek() ?? 0,
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
				if (!zone.precipRate || zone.precipRate <= 0) return null;

				const minutesPerWeek = getIrrigationRuntimeMinutes({
					targetDepthInches: remainingInches,
					precipitationRateInchesPerHour: zone.precipRate,
				});

				if (minutesPerWeek === null) return null;

				return {
					id: zone.id,
					name: zone.name || `Zone ${zone.id}`,
					precipRate: zone.precipRate,
					minutesPerWeek,
					minutesPerDay: Math.round(minutesPerWeek / wateringDays),
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
		this.targetWeeklyWaterInches.set(this.parseNumber(value));
	}

	public onRainfallThisWeekChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.rainfallThisWeekInches.set(this.parseNumber(value));
	}

	public onWateringDaysChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.wateringDaysPerWeek.set(this.parseNumber(value));
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
		const parsed = this.parseNumber(value);
		this.zones.update((zones) =>
			zones.map((zone) =>
				zone.id === zoneId ? { ...zone, precipRate: parsed } : zone,
			),
		);
	}

	public addZone(): void {
		const nextId = this._zoneIdCounter++;
		this.zones.update((zones) => [
			...zones,
			{ id: nextId, name: `Zone ${nextId}`, precipRate: null },
		]);
	}

	public removeZone(zoneId: number): void {
		this.zones.update((zones) =>
			zones.length === 1 ? zones : zones.filter((zone) => zone.id !== zoneId),
		);
	}
}
