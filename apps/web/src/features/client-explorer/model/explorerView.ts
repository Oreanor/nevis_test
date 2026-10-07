import { z } from 'zod';

import { type Breakdown, TOTAL_ID } from './pivot';

const breakdownSchema = z.enum(['branch', 'clientType', 'adviser']) satisfies z.ZodType<Breakdown>;

/** How each dimension is named in the UI: as an option, as a legend title and in running text. */
export const DIMENSION_TEXT: Readonly<Record<Breakdown, { label: string; plural: string; noun: string }>> = {
  branch: { label: 'Branch', plural: 'Branches', noun: 'branch' },
  adviser: { label: 'Adviser', plural: 'Advisers', noun: 'adviser' },
  clientType: { label: 'Client type', plural: 'Client types', noun: 'client type' },
};

/** Breakdowns in the order the selector offers them. */
export const BREAKDOWN_OPTIONS: readonly { value: Breakdown; label: string }[] = (
  ['branch', 'adviser', 'clientType'] as const
).map((value) => ({ value, label: DIMENSION_TEXT[value].label }));

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
