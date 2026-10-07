import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import { useChart } from './ChartContext';

interface ChartCanvasProps {
  children: ReactNode;
  className?: string;
}

/**
 * The SVG surface. Children draw in plot coordinates (margins already applied).
 * Hidden from assistive technology – pair it with `ChartDataTable` or another text alternative.
 * Scrolls horizontally when the chart is wider than its container (see `ChartRoot` `minWidth`).
 */
export function ChartCanvas({ children, className }: ChartCanvasProps) {
  const { width, height, margin } = useChart();

  return (
    <div className={clsx('overflow-x-auto overflow-y-hidden', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        focusable="false"
        className="block"
      >
        <g transform={`translate(${margin.left},${margin.top})`}>{children}</g>
      </svg>
    </div>
  );
}
