import type { ChartDatum, ChartSeries, StackedSegment } from './types';

/**
 * Stacks each datum's values in series order (first series at the bottom).
 * Missing or negative values are treated as 0 – the kit only supports positive stacks.
 */
export function stackData(data: readonly ChartDatum[], series: readonly ChartSeries[]): StackedSegment[][] {
  return data.map((datum) => {
    let total = 0;
    const segments = series.map((s): StackedSegment => {
      const value = Math.max(0, datum.values[s.key] ?? 0);
      const y0 = total;
      total += value;
      return { datum, series: s, value, y0, y1: total, isTop: false };
    });

    const top = segments.findLast((segment) => segment.value > 0);
    if (top) top.isTop = true;
    return segments;
  });
}

export function maxStackTotal(stacks: readonly (readonly StackedSegment[])[]): number {
  return stacks.reduce((max, segments) => Math.max(max, segments.at(-1)?.y1 ?? 0), 0);
}
