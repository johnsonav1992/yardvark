import { ChartData, ChartOptions } from "chart.js";
import { format } from "date-fns";
import { GddForecastResponse } from "../types/gdd.types";
import { getPrimeNgHexColor } from "./styleUtils";

type UiOptions = {
	isDarkMode: boolean;
	isMobile: boolean;
};

export type GddChartConfig = {
	title: string;
	desc?: string;
	chartData: ChartData;
	options: ChartOptions;
};

const getGridOptions = (isDarkMode: boolean) =>
	isDarkMode ? { color: "rgba(200, 200, 200, 0.2)" } : undefined;

export const getGddForecastChartConfig = (
	forecastData: GddForecastResponse | undefined,
	uiOptions: UiOptions,
): GddChartConfig => {
	if (!forecastData?.forecastedGdd?.length) {
		return {
			title: "7-Day GDD Forecast",
			chartData: {
				labels: [],
				datasets: [],
			},
			options: {
				maintainAspectRatio: false,
				aspectRatio: uiOptions.isMobile ? 1.1 : 0.75,
			},
		};
	}

	const labels = forecastData.forecastedGdd.map((point) =>
		format(new Date(point.date), "EEE"),
	);

	const dailyGdd = forecastData.forecastedGdd.map(
		(point) => point.estimatedGdd,
	);

	let runningGddTotal = forecastData.currentAccumulatedGdd;
	const cumulativeGdd = forecastData.forecastedGdd.map((point) => {
		runningGddTotal += point.estimatedGdd;
		return runningGddTotal;
	});

	const grid = getGridOptions(uiOptions.isDarkMode);

	const datasets = [
		{
			type: "bar" as const,
			label: "Daily GDD",
			data: dailyGdd,
			backgroundColor: getPrimeNgHexColor("amber.300"),
			borderColor: getPrimeNgHexColor("amber.500"),
			yAxisID: "y",
			order: 1,
		},
		{
			type: "line" as const,
			label: "Cumulative GDD",
			data: cumulativeGdd,
			borderColor: getPrimeNgHexColor("teal.500"),
			backgroundColor: "transparent",
			tension: 0.3,
			yAxisID: "y1",
			order: 0,
		},
		{
			type: "line" as const,
			label: "Target GDD",
			data: Array(labels.length).fill(forecastData.targetGdd),
			borderColor: getPrimeNgHexColor("rose.500"),
			borderDash: [5, 5],
			borderWidth: 2,
			pointRadius: 0,
			yAxisID: "y1",
			order: 0,
		},
	];

	return {
		title: "7-Day GDD Forecast",
		desc: "Estimated daily GDD and cumulative accumulation toward your target",
		chartData: {
			labels,
			datasets,
		},
		options: {
			maintainAspectRatio: false,
			aspectRatio: uiOptions.isMobile ? 1.1 : 0.75,
			scales: {
				y: {
					type: "linear",
					position: "left",
					beginAtZero: true,
					grid,
					title: {
						display: true,
						text: "Daily GDD",
					},
				},
				y1: {
					type: "linear",
					position: "right",
					beginAtZero: true,
					grid: { drawOnChartArea: false },
					title: {
						display: true,
						text: "Cumulative GDD",
					},
				},
				x: { grid },
			},
			plugins: {
				tooltip: {
					callbacks: {
						label: (context) => {
							const value = context.raw as number;
							return `${context.dataset.label}: ${value.toFixed(1)} GDD`;
						},
					},
				},
			},
		},
	};
};
