import { Component, computed, input } from "@angular/core";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import {
	getSoilMoistureInsight,
	getSoilTemperatureInsight,
	type SoilConditionInsight,
	type SoilTrend,
} from "../../../utils/soilTemperatureUtils";

@Component({
	selector: "soil-conditions-card",
	imports: [CardModule, SkeletonModule],
	templateUrl: "./soil-conditions-card.component.html",
	styleUrl: "./soil-conditions-card.component.scss",
})
export class SoilConditionsCardComponent {
	public shallowTemp = input<number | null>(null);
	public deepTemp = input<number | null>(null);
	public moisturePct = input<number | null>(null);
	public tempUnit = input.required<"fahrenheit" | "celsius">();
	public grassType = input.required<"cool" | "warm">();
	public tempTrend = input<SoilTrend | null>(null);
	public moistureTrend = input<SoilTrend | null>(null);
	public isLoading = input<boolean>(false);

	public displayTempUnit = computed(() =>
		this.tempUnit() === "fahrenheit" ? "°F" : "°C",
	);

	public temperatureInsight = computed<SoilConditionInsight | null>(() => {
		const temp = this.shallowTemp();

		if (temp === null) return null;

		return getSoilTemperatureInsight(temp, this.tempUnit(), this.grassType());
	});

	public moistureInsight = computed<SoilConditionInsight | null>(() => {
		const moisture = this.moisturePct();

		if (moisture === null) return null;

		return getSoilMoistureInsight(moisture, this.grassType());
	});
}
