import { describe, expect, it } from 'vitest';

import { bandScale, linearScale, niceTicks } from './scales';

describe('linearScale', () => {
  it('maps domain to range, including inverted ranges for SVG y axes', () => {
    const y = linearScale([0, 400], [320, 0]);
    expect(y(0)).toBe(320);
    expect(y(400)).toBe(0);
    expect(y(100)).toBe(240);
    expect(y.domain).toEqual([0, 400]);
  });

  it('returns the range start for a zero-span domain instead of NaN', () => {
    expect(linearScale([0, 0], [100, 0])(0)).toBe(100);
  });
});

describe('bandScale', () => {
  it('splits the range into equal steps with inner and outer padding', () => {
    const x = bandScale(['a', 'b', 'c'], [0, 300], { paddingInner: 0, paddingOuter: 0 });
    expect(x.step).toBe(100);
    expect(x.bandwidth).toBe(100);
    expect([x('a'), x('b'), x('c')]).toEqual([0, 100, 200]);
  });

  it('keeps bands inside the range when padded', () => {
    const x = bandScale(['a', 'b'], [0, 100], { paddingInner: 0.2 });
    const lastBandEnd = x('b') + x.bandwidth;
    expect(x('a')).toBeGreaterThan(0);
    expect(lastBandEnd).toBeLessThan(100);
    expect(x('a')).toBeCloseTo(100 - lastBandEnd);
    expect(x.bandwidth / x.step).toBeCloseTo(0.8);
  });

  it('returns NaN for unknown keys', () => {
    expect(bandScale(['a'], [0, 10])('missing')).toBeNaN();
  });
});

describe('niceTicks', () => {
  it.each([
    [350, 4, [0, 100, 200, 300, 400]],
    [400, 4, [0, 100, 200, 300, 400]],
    [38, 4, [0, 10, 20, 30, 40]],
    [9, 4, [0, 2.5, 5, 7.5, 10]],
    [0.3, 3, [0, 0.1, 0.2, 0.3]],
  ])('max %d with %d ticks → %j', (max, count, expected) => {
    expect(niceTicks(max, count)).toEqual(expected);
  });

  it('returns a single zero tick for empty or invalid input', () => {
    expect(niceTicks(0)).toEqual([0]);
    expect(niceTicks(Number.NaN)).toEqual([0]);
    expect(niceTicks(10, 0)).toEqual([0]);
  });
});
