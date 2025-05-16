import { ScriptableScaleContext } from 'chart.js';

/**
 * Returns the appropriate chart grid line color based on context and current theme mode.
 * Highlights the middle of the week (index 3) with a different color.
 *
 * @param context - The scriptable scale context from the chart library
 * @param currentMode - The current theme mode ('light' or 'dark')
 * @returns The color value for the chart grid line
 */
export const getChartGridLineColors = (
  context: ScriptableScaleContext,
  currentMode: 'light' | 'dark'
) => {
  const isMiddleOfTheWeek = context.index === 3;

  if (isMiddleOfTheWeek) {
    return currentMode === 'dark'
      ? DARK_MODE_CHART_GRID_COLOR_HIGHLIGHT
      : LIGHT_MODE_CHART_GRID_COLOR_HIGHLIGHT;
  }

  return currentMode === 'dark'
    ? DARK_MODE_CHART_GRID_COLOR
    : LIGHT_MODE_CHART_GRID_COLOR;
};
