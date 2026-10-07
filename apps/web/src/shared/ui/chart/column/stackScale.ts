import { type LinearScale, linearScale, niceTicks } from '../scales';
import { maxStackTotal } from '../stack';
import type { StackedSegment } from '../types';

export interface StackScale {
  yScale: LinearScale;
  ticks: readonly number[];
  /** SVG height the scale was built for. */
  height: number;
}

interface StackScaleOptions {
  /** Pixel height of each column. */
  height: number;
  /** Space kept free above the highest tick (e.g. for its label), in px. */
  paddingTop?: number;
  /** Space kept free below the baseline, in px. */
  paddingBottom?: number;
  tickCount?: number;
}

/** One y scale shared by a set of independently rendered columns (e.g. one per table cell). */
export function createStackScale(
  stacks: readonly (readonly StackedSegment[])[],
  { height, paddingTop = 10, paddingBottom = 0, tickCount = 4 }: StackScaleOptions,
): StackScale {
  const ticks = niceTicks(maxStackTotal(stacks), tickCount);
  const top = ticks.at(-1) ?? 0;
  return {
    yScale: linearScale([0, top], [Math.max(paddingTop, height - paddingBottom), paddingTop]),
    ticks,
    height,
  };
}
