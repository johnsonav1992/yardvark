import { Component } from "@angular/core";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";

@Component({
	selector: "card-skeleton",
	imports: [CardModule, SkeletonModule],
	templateUrl: "./card-skeleton.component.html",
	styleUrl: "./card-skeleton.component.scss",
})
export class CardSkeletonComponent {}
