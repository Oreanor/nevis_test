import { DEFAULT_LABEL_CLASS } from '../axisStyles';
import type { StackScale } from './stackScale';

interface ColumnYAxisProps {
  scale: StackScale;
  tickFormat?: (value: number) => string;
  /** Distance from the tick line down to the label baseline, in px. */
  baselineOffset?: number;
  /** Width of the axis box; labels are right-aligned in it. */
  width?: number;
  className?: string;
}

/** Y-axis labels for columns drawn with `ColumnStack`, rendered in their own box (e.g. a pinned column). */
export function ColumnYAxis({
  scale,
  tickFormat = String,
  baselineOffset = 4,
  width = 32,
  className = DEFAULT_LABEL_CLASS,
}: ColumnYAxisProps) {
  return (
    <svg width={width} height={scale.height} aria-hidden="true" focusable="false" className="block">
      <g className={className} data-chart-layer="y-axis">
        {scale.ticks.map((tick) => (
          <text key={tick} x={width} y={scale.yScale(tick) + baselineOffset} textAnchor="end">
            {tickFormat(tick)}
          </text>
        ))}
      </g>
    </svg>
  );
}
