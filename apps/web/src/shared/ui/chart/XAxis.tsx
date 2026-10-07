import { DEFAULT_LABEL_CLASS } from './axisStyles';
import { useChart } from './ChartContext';
import type { ChartDatum } from './types';

/** One label, or several lines (empty lines keep their space so labels stay aligned). */
export type TickLabel = string | readonly string[];

interface XAxisProps {
  tickFormat?: (datum: ChartDatum, index: number) => TickLabel;
  /** Distance from the bottom of the plot area to the first label baseline, in px. */
  offset?: number;
  /** Distance between label lines, in px. */
  lineHeight?: number;
  /** Label styling; replaces the default `fill-muted text-footnote`. */
  className?: string;
}

/** Category labels centred under each band (no axis line, like the design). */
export function XAxis({
  tickFormat = (datum) => datum.label,
  offset = 20,
  lineHeight = 13,
  className = DEFAULT_LABEL_CLASS,
}: XAxisProps) {
  const { data, xScale, innerHeight } = useChart();

  return (
    <g className={className} data-chart-layer="x-axis">
      {data.map((datum, index) => {
        const x = xScale(datum.key) + xScale.bandwidth / 2;
        const label = tickFormat(datum, index);
        const lines = typeof label === 'string' ? [label] : label;
        return (
          <text key={datum.key} x={x} y={innerHeight + offset} textAnchor="middle">
            {lines.map((line, lineIndex) => (
              <tspan key={lineIndex} x={x} dy={lineIndex === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </g>
  );
}
