import { clsx } from 'clsx';
import { type ReactNode, useMemo } from 'react';

import { useElementSize } from '@/shared/lib/useElementSize';

import { ChartContext, type ChartContextValue } from './ChartContext';
import { bandScale, linearScale, niceTicks } from './scales';
import { maxStackTotal, stackData } from './stack';
import type { ChartDatum, ChartMargin, ChartSeries } from './types';

const DEFAULT_MARGIN: ChartMargin = { top: 16, right: 0, bottom: 32, left: 40 };

export interface ChartRootProps {
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  /** SVG height in px. */
  height: number;
  /** Fixed SVG width in px. When omitted the chart fills its container. */
  width?: number;
  /** Below this width the canvas stops shrinking and scrolls horizontally instead. */
  minWidth?: number;
  margin?: Partial<ChartMargin>;
  /** Upper bound of the y axis; rounded up to a nice tick value. Defaults to the tallest stack. */
  yMax?: number;
  yTickCount?: number;
  /** Fraction of each band left empty between bars (0..1). */
  bandPadding?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Owns layout and scales for a stacked bar chart and shares them via context.
 * Visual layers (`ChartCanvas`, `GridLines`, `YAxis`, `XAxis`, `StackedBars`, `ChartLegend`, …)
 * are composed as children, so any of them can be omitted, restyled or replaced via `useChart()`.
 */
export function ChartRoot({
  data,
  series,
  height,
  width: fixedWidth,
  minWidth = 0,
  margin: marginOverrides,
  yMax,
  yTickCount = 4,
  bandPadding = 0.2,
  className,
  children,
}: ChartRootProps) {
  const [containerRef, containerSize] = useElementSize<HTMLDivElement>();
  const width = fixedWidth ?? Math.max(containerSize.width, minWidth);

  const top = marginOverrides?.top ?? DEFAULT_MARGIN.top;
  const right = marginOverrides?.right ?? DEFAULT_MARGIN.right;
  const bottom = marginOverrides?.bottom ?? DEFAULT_MARGIN.bottom;
  const left = marginOverrides?.left ?? DEFAULT_MARGIN.left;

  const value = useMemo<ChartContextValue>(() => {
    const margin = { top, right, bottom, left };
    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = Math.max(0, height - margin.top - margin.bottom);
    const stacks = stackData(data, series);
    const yTicks = niceTicks(Math.max(yMax ?? 0, maxStackTotal(stacks)), yTickCount);
    const yTop = yTicks.at(-1) ?? 0;

    return {
      data,
      series,
      stacks,
      width,
      height,
      margin,
      innerWidth,
      innerHeight,
      xScale: bandScale(
        data.map((d) => d.key),
        [0, innerWidth],
        { paddingInner: bandPadding },
      ),
      yScale: linearScale([0, yTop], [innerHeight, 0]),
      yTicks,
    };
  }, [data, series, width, height, top, right, bottom, left, yMax, yTickCount, bandPadding]);

  return (
    <div ref={containerRef} className={clsx('w-full min-w-0', className)}>
      {width > 0 && <ChartContext value={value}>{children}</ChartContext>}
    </div>
  );
}
