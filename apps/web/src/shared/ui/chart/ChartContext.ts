import { createContext, useContext } from 'react';

import type { BandScale, LinearScale } from './scales';
import type { ChartDatum, ChartMargin, ChartSeries, StackedSegment } from './types';

export interface ChartContextValue {
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  stacks: readonly (readonly StackedSegment[])[];
  /** Full SVG size. */
  width: number;
  height: number;
  margin: ChartMargin;
  /** Plot area size (SVG size minus margins). Layers draw in plot coordinates. */
  innerWidth: number;
  innerHeight: number;
  xScale: BandScale;
  yScale: LinearScale;
  yTicks: readonly number[];
}

export const ChartContext = createContext<ChartContextValue | null>(null);

/** Access scales and data from inside `<ChartRoot>` – use it to build custom layers. */
export function useChart(): ChartContextValue {
  const context = useContext(ChartContext);
  if (!context) throw new Error('useChart must be used inside <ChartRoot>');
  return context;
}
