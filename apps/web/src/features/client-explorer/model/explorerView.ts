import { z } from 'zod';

import { type Breakdown, TOTAL_ID } from './pivot';

const breakdownSchema = z.enum(['branch', 'clientType', 'adviser']) satisfies z.ZodType<Breakdown>;

export const BREAKDOWN_OPTIONS: readonly { value: Breakdown; label: string }[] = [
  { value: 'branch', label: 'Branch' },
  { value: 'adviser', label: 'Adviser' },
  { value: 'clientType', label: 'Client type' },
];

/** What the explorer shows; lives in the URL so views can be shared and Back works. */
export interface ExplorerView {
  breakdown: Breakdown;
  /** Id of the row whose children the chart shows. */
  scopeId: string;
}

const DEFAULT_VIEW: ExplorerView = { breakdown: 'branch', scopeId: TOTAL_ID };

export function parseView(params: URLSearchParams): ExplorerView {
  const breakdown = breakdownSchema.safeParse(params.get('by'));
  return {
    breakdown: breakdown.success ? breakdown.data : DEFAULT_VIEW.breakdown,
    scopeId: params.get('scope') || DEFAULT_VIEW.scopeId,
  };
}

/** Search params for a view; defaults are left out to keep URLs short. */
export function toSearchParams({ breakdown, scopeId }: ExplorerView): URLSearchParams {
  const params = new URLSearchParams();
  if (breakdown !== DEFAULT_VIEW.breakdown) params.set('by', breakdown);
  if (scopeId !== DEFAULT_VIEW.scopeId) params.set('scope', scopeId);
  return params;
}
