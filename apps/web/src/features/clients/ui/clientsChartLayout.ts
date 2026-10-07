import type { MonthColumn } from '@/shared/lib/months';
import type { ChartMargin, TickLabel } from '@/shared/ui/chart';

export interface ClientsChartLayout {
  height: number;
  minWidth: number;
  margin: ChartMargin;
  bandPadding: number;
  yAxisOffset: number;
  /** Distance from a grid line down to its label baseline. */
  yLabelBaselineOffset: number;
  xAxisOffset: number;
  /** Tailwind classes for axis labels (e.g. a smaller font on phones). */
  axisClassName?: string;
  monthLabel: (month: MonthColumn) => TickLabel;
}

/**
 * Month name, with the year underneath on the first month and on every January,
 * so 12 bars fit a phone screen without losing the year context.
 */
export function compactMonthLabel(month: MonthColumn): TickLabel {
  const showYear = month.index === 0 || month.month === 1;
  return [month.shortLabel, showYear ? String(month.year) : ''];
}

/**
 * Matches the Figma mockup (1440px frame): plot area 320px tall starting 34px below the card top and 54px from
 * its left edge, 87.5px bars on a 111.5px step, month labels centred 20px below the baseline.
 */
export const regularLayout: ClientsChartLayout = {
  height: 366,
  minWidth: 900,
  margin: { top: 10, right: 0, bottom: 36, left: 38 },
  bandPadding: 0.215,
  yAxisOffset: 12,
  yLabelBaselineOffset: 2,
  xAxisOffset: 24,
  monthLabel: (month) => month.label,
};

/** Phones: all months fit without scrolling and the chart stays within the top half of the screen. */
export const compactLayout: ClientsChartLayout = {
  height: 220,
  minWidth: 300,
  margin: { top: 8, right: 0, bottom: 34, left: 30 },
  bandPadding: 0.25,
  yAxisOffset: 8,
  yLabelBaselineOffset: 4,
  xAxisOffset: 16,
  axisClassName: 'fill-muted text-micro',
  monthLabel: compactMonthLabel,
};
