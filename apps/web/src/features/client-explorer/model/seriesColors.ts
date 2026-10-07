import { isClientTypeId } from '@nevis/shared';

import type { ClientFact } from './facts';
import { ADVISER_STEPS, BRANCH_COLORS, CLIENT_TYPE_COLORS, NEUTRAL_SERIES_COLOR } from './palette';
import type { PivotNode } from './pivot';

export interface SeriesColors {
  /** Colour of a node when it is drawn as a chart series. */
  colorOf(node: Pick<PivotNode, 'dimension' | 'memberId'>): string;
}

/**
 * Assigns colours to entities from the whole dataset, so a branch or adviser keeps its colour in every
 * breakdown and scope (colour follows the entity, never its position in the current chart).
 */
export function createSeriesColors(facts: readonly ClientFact[]): SeriesColors {
  const branchSlot = new Map<string, number>();
  const adviserColor = new Map<string, string>();
  const advisersPerBranch = new Map<string, number>();

  for (const { branch, adviser } of facts) {
    if (!branchSlot.has(branch.id)) branchSlot.set(branch.id, branchSlot.size);
    if (adviserColor.has(adviser.id)) continue;

    const slot = branchSlot.get(branch.id) ?? 0;
    const index = advisersPerBranch.get(branch.id) ?? 0;
    advisersPerBranch.set(branch.id, index + 1);
    adviserColor.set(adviser.id, ADVISER_STEPS[slot]?.[index] ?? NEUTRAL_SERIES_COLOR);
  }

  return {
    colorOf({ dimension, memberId }) {
      switch (dimension) {
        case 'branch': {
          const slot = branchSlot.get(memberId);
          return (slot !== undefined && BRANCH_COLORS[slot]) || NEUTRAL_SERIES_COLOR;
        }
        case 'adviser':
          return adviserColor.get(memberId) ?? NEUTRAL_SERIES_COLOR;
        case 'clientType':
          return isClientTypeId(memberId) ? CLIENT_TYPE_COLORS[memberId] : NEUTRAL_SERIES_COLOR;
        default:
          return NEUTRAL_SERIES_COLOR;
      }
    },
  };
}
