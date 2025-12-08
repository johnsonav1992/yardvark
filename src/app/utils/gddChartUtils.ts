import { ChartData, ChartOptions } from 'chart.js';
import { format } from 'date-fns';
import { GddForecastResponse, DailyGddDataPoint } from '../types/gdd.types';
import { getPrimeNgHexColor } from './styleUtils';

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
  isDarkMode ? { color: 'rgba(200, 200, 200, 0.2)' } : undefined;

export const getGddForecastChartConfig = (
  forecastData: GddForecastResponse | undefined,
  uiOptions: UiOptions
): GddChartConfig => {
  if (!forecastData?.forecastedGdd?.length) {
    return {
      title: '7-Day GDD Forecast',
      chartData: {
        labels: [],
        datasets: []
      },
      options: {
        maintainAspectRatio: false,
        aspectRatio: uiOptions.isMobile ? 1.1 : 0.75
      }
    };
  }

  const labels = forecastData.forecastedGdd.map((point) =>
    format(new Date(point.date), 'EEE')
  );

  const dailyGdd = forecastData.forecastedGdd.map(
    (point) => point.estimatedGdd
  );

  let runningGddTotal = forecastData.currentAccumulatedGdd;
  const cumulativeGdd = forecastData.forecastedGdd.map((point) => {
    runningGddTotal += point.estimatedGdd;
    return runningGddTotal;
  });

  const grid = getGridOptions(uiOptions.isDarkMode);

  const datasets = [
    {
      type: 'bar' as const,
      label: 'Daily GDD',
      data: dailyGdd,
      backgroundColor: getPrimeNgHexColor('primary.300'),
      borderColor: getPrimeNgHexColor('primary.500'),
      yAxisID: 'y'
    },
    {
      type: 'line' as const,
      label: 'Cumulative GDD',
      data: cumulativeGdd,
      borderColor: getPrimeNgHexColor('teal.500'),
      backgroundColor: 'transparent',
      tension: 0.3,
      yAxisID: 'y1'
    },
    {
      type: 'line' as const,
      label: 'Target GDD',
      data: Array(labels.length).fill(forecastData.targetGdd),
      borderColor: getPrimeNgHexColor('rose.500'),
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0,
      yAxisID: 'y1'
    }
  ];

  return {
    title: '7-Day GDD Forecast',
    desc: 'Estimated daily GDD and cumulative accumulation toward your target',
    chartData: {
      labels,
      datasets
    },
    options: {
      maintainAspectRatio: false,
      aspectRatio: uiOptions.isMobile ? 1.1 : 0.75,
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          grid,
          title: {
            display: true,
            text: 'Daily GDD'
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: 'Cumulative GDD'
          }
        },
        x: { grid }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              return `${context.dataset.label}: ${value.toFixed(1)} GDD`;
            }
          }
        }
      }
    }
  };
};

export const getGddHistoricalChartConfig = (
  dailyGddData: DailyGddDataPoint[] | undefined,
  targetGdd: number,
  uiOptions: UiOptions
): GddChartConfig => {
  if (!dailyGddData?.length) {
    return {
      title: 'GDD Accumulation History',
      chartData: {
        labels: [],
        datasets: []
      },
      options: {
        maintainAspectRatio: false,
        aspectRatio: uiOptions.isMobile ? 1.1 : 0.75
      }
    };
  }

  const labels = dailyGddData.map((point) =>
    format(new Date(point.date), 'MMM dd')
  );

  let runningGddTotal = 0;
  const cumulativeGdd = dailyGddData.map((point) => {
    runningGddTotal += point.gdd;
    return runningGddTotal;
  });

  const grid = getGridOptions(uiOptions.isDarkMode);

  const datasets = [
    {
      type: 'line' as const,
      label: 'Accumulated GDD',
      data: cumulativeGdd,
      borderColor: getPrimeNgHexColor('teal.500'),
      backgroundColor: getPrimeNgHexColor('teal.100'),
      fill: true,
      tension: 0.3
    },
    {
      type: 'line' as const,
      label: 'Target GDD',
      data: Array(labels.length).fill(targetGdd),
      borderColor: getPrimeNgHexColor('rose.500'),
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0
    }
  ];

  return {
    title: 'GDD Accumulation History',
    desc: 'Cumulative GDD accumulation since your last PGR application',
    chartData: {
      labels,
      datasets
    },
    options: {
      maintainAspectRatio: false,
      aspectRatio: uiOptions.isMobile ? 1.1 : 0.75,
      scales: {
        y: {
          beginAtZero: true,
          grid,
          title: {
            display: true,
            text: 'GDD'
          }
        },
        x: { grid }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              return `${context.dataset.label}: ${value.toFixed(1)} GDD`;
            }
          }
        }
      }
    }
  };
};
