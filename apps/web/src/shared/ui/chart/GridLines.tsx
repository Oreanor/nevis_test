import { clsx } from 'clsx';

import { useChart } from './ChartContext';

interface GridLinesProps {
  /** SVG dash pattern; pass `undefined` for solid lines. Default: round dots every 7px, as in the design. */
  strokeDasharray?: string;
  className?: string;
}

/** Horizontal lines at each y tick. */
export function GridLines({ strokeDasharray = '1 6', className }: GridLinesProps) {
  const { yTicks, yScale, innerWidth } = useChart();

  return (
    <g className={clsx('stroke-grid', className)} strokeLinecap="round" data-chart-layer="grid">
      {yTicks.map((tick) => (
        <line
          key={tick}
          x1={0}
          x2={innerWidth}
          y1={yScale(tick)}
          y2={yScale(tick)}
          strokeDasharray={strokeDasharray}
        />
      ))}
    </g>
  );
}
