export type Interval = readonly [number, number];

export interface LinearScale {
  (value: number): number;
  readonly domain: Interval;
  readonly range: Interval;
}

export function linearScale(domain: Interval, range: Interval): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const scale = (value: number) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0));
  return Object.assign(scale, { domain, range });
}

export interface BandScale {
  (key: string): number;
  readonly domain: readonly string[];
  readonly bandwidth: number;
  readonly step: number;
}

export interface BandScaleOptions {
  /** Fraction of the step left empty between bands (0..1). */
  paddingInner?: number;
  /** Fraction of the step left empty before the first and after the last band. */
  paddingOuter?: number;
}

/** Evenly spaced bands for categorical x positions. Unknown keys map to NaN. */
export function bandScale(
  domain: readonly string[],
  range: Interval,
  { paddingInner = 0.2, paddingOuter = paddingInner / 2 }: BandScaleOptions = {},
): BandScale {
  const [r0, r1] = range;
  const n = domain.length;
  const step = (r1 - r0) / Math.max(1, n - paddingInner + paddingOuter * 2);
  const start = r0 + step * paddingOuter;
  const bandwidth = step * (1 - paddingInner);
  const index = new Map(domain.map((key, i) => [key, i]));

  const scale = (key: string) => {
    const i = index.get(key);
    return i === undefined ? Number.NaN : start + step * i;
  };
  return Object.assign(scale, { domain, bandwidth, step });
}

const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
 * Round tick values from 0 up to at least `max`, roughly `targetCount` intervals apart
 * (e.g. max 350, 4 ticks → 0, 100, 200, 300, 400).
 */
export function niceTicks(max: number, targetCount = 4): number[] {
  if (!(max > 0) || targetCount < 1) return [0];

  const rawStep = max / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (NICE_STEPS.find((candidate) => normalized <= candidate) ?? 10) * magnitude;
  const count = Math.ceil(max / step);

  // Rounding avoids float drift such as 0.30000000000000004 for fractional steps.
  const precision = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Array.from({ length: count + 1 }, (_, i) => Number((i * step).toFixed(precision)));
}
