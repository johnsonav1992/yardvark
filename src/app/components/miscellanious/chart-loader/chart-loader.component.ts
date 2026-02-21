import { Component } from "@angular/core";
import { SkeletonModule } from "primeng/skeleton";

@Component({
	selector: "chart-loader",
	imports: [SkeletonModule],
	templateUrl: "./chart-loader.component.html",
	styleUrl: "./chart-loader.component.scss",
})
export class ChartLoaderComponent {}
