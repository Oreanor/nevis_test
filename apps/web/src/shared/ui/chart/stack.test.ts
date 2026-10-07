import { describe, expect, it } from 'vitest';

import { maxStackTotal, stackData } from './stack';
import type { ChartDatum, ChartSeries } from './types';

const series: ChartSeries[] = [
  { key: 'a', label: 'A', color: 'red' },
  { key: 'b', label: 'B', color: 'blue' },
  { key: 'c', label: 'C', color: 'green' },
];

const datum = (key: string, values: Record<string, number>): ChartDatum => ({ key, label: key, values });

describe('stackData', () => {
  it('stacks values in series order, bottom to top', () => {
    const [stack] = stackData([datum('m1', { a: 10, b: 5, c: 1 })], series);

    expect(stack?.map(({ series: s, y0, y1 }) => [s.key, y0, y1])).toEqual([
      ['a', 0, 10],
      ['b', 10, 15],
      ['c', 15, 16],
    ]);
  });

  it('marks the topmost non-empty segment, skipping zeros on top', () => {
    const [stack] = stackData([datum('m1', { a: 10, b: 5, c: 0 })], series);
    expect(stack?.filter((s) => s.isTop).map((s) => s.series.key)).toEqual(['b']);
  });

  it('treats missing and negative values as zero', () => {
    const [stack] = stackData([datum('m1', { a: -3, c: 2 })], series);
    expect(stack?.map((s) => s.value)).toEqual([0, 0, 2]);
    expect(stack?.at(-1)?.y1).toBe(2);
  });

  it('has no top segment when every value is zero', () => {
    const [stack] = stackData([datum('m1', {})], series);
    expect(stack?.some((s) => s.isTop)).toBe(false);
  });
});

describe('maxStackTotal', () => {
  it('returns the tallest stack', () => {
    const stacks = stackData([datum('m1', { a: 1, b: 2 }), datum('m2', { a: 4, c: 3 })], series);
    expect(maxStackTotal(stacks)).toBe(7);
  });

  it('is 0 without data', () => {
    expect(maxStackTotal([])).toBe(0);
  });
});
