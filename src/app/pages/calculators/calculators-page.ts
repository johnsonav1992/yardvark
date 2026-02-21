import { Component } from "@angular/core";
import { FertilizerCalculator } from "../../components/calculators/fertilizer-calculator/fertilizer-calculator";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";

@Component({
	selector: "calculators-page",
	imports: [PageContainerComponent, FertilizerCalculator],
	templateUrl: "./calculators-page.html",
	styleUrl: "./calculators-page.scss",
})
export class CalculatorsPage {}
