import { DEFAULT_LABEL_CLASS } from './axisStyles';
import { useChart } from './ChartContext';

interface YAxisProps {
  tickFormat?: (value: number) => string;
  /** Gap between the labels and the plot area, in px. */
  offset?: number;
  /**
   * Distance from the tick line down to the label baseline, in px. The default centres 12px digits on the
   * line; the design places them slightly higher.
   */
  baselineOffset?: number;
  /** Label styling; replaces the default `fill-muted text-footnote`. */
  className?: string;
}

/** Tick labels on the left of the plot area (no axis line, like the design). */
export function YAxis({
  tickFormat = String,
  offset = 12,
  baselineOffset = 4,
  className = DEFAULT_LABEL_CLASS,
}: YAxisProps) {
  const { yTicks, yScale } = useChart();

  return (
    <g className={className} data-chart-layer="y-axis">
      {yTicks.map((tick) => (
        <text key={tick} x={-offset} y={yScale(tick) + baselineOffset} textAnchor="end">
          {tickFormat(tick)}
        </text>
      ))}
    </g>
  );
}
