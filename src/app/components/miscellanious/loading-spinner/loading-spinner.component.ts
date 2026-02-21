import { Component, computed, input } from "@angular/core";
import type { ProgressSpinnerDesignTokens } from "@primeuix/themes/types/progressspinner";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
	selector: "loading-spinner",
	imports: [ProgressSpinnerModule],
	templateUrl: "./loading-spinner.component.html",
	styleUrl: "./loading-spinner.component.scss",
})
export class LoadingSpinnerComponent {
	public size = input<"xs" | "s" | "m" | "l">("l");

	public renderedSize = computed(() => {
		const sizeMap = {
			xs: "20px",
			s: "50px",
			m: "80px",
			l: "100px",
		};

		return sizeMap[this.size()] || sizeMap.l;
	});

	public spinnerDt: ProgressSpinnerDesignTokens = {
		root: {
			colorOne: "{primary.500}",
			colorTwo: "{primary.500}",
			colorThree: "{primary.500}",
			colorFour: "{primary.500}",
		},
	};
}
