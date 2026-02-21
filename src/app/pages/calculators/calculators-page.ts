import { Component } from "@angular/core";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";
import { FertilizerCalculator } from "../../components/calculators/fertilizer-calculator/fertilizer-calculator";

@Component({
	selector: "calculators-page",
	imports: [PageContainerComponent, FertilizerCalculator],
	templateUrl: "./calculators-page.html",
	styleUrl: "./calculators-page.scss",
})
export class CalculatorsPage {}
