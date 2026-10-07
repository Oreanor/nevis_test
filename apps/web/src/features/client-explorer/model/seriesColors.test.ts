import { describe, expect, it } from 'vitest';

import { explorerFixture } from '../testing/explorerFixture';
import { toFacts } from './facts';
import { ADVISER_STEPS, BRANCH_COLORS, CLIENT_TYPE_COLORS, NEUTRAL_SERIES_COLOR } from './palette';
import { buildPivotTree } from './pivot';
import { createSeriesColors } from './seriesColors';

const facts = toFacts(explorerFixture);
const colors = createSeriesColors(facts);

describe('createSeriesColors', () => {
  it('gives branches the categorical slots in data order', () => {
    expect(['a', 'b', 'c'].map((memberId) => colors.colorOf({ dimension: 'branch', memberId }))).toEqual(
      BRANCH_COLORS.slice(0, 3),
    );
  });

  it("gives advisers steps of their branch's hue", () => {
    expect(colors.colorOf({ dimension: 'adviser', memberId: 'anna' })).toBe(ADVISER_STEPS[0]?.[0]);
    expect(colors.colorOf({ dimension: 'adviser', memberId: 'james' })).toBe(ADVISER_STEPS[0]?.[1]);
    expect(colors.colorOf({ dimension: 'adviser', memberId: 'olivia' })).toBe(ADVISER_STEPS[1]?.[0]);
  });

  it('keeps client types on their fixed colours and unknown series neutral', () => {
    expect(colors.colorOf({ dimension: 'clientType', memberId: 'paid' })).toBe(CLIENT_TYPE_COLORS.paid);
    expect(colors.colorOf({ dimension: 'clientType', memberId: 'unspecified' })).toBe(NEUTRAL_SERIES_COLOR);
    expect(colors.colorOf({ dimension: 'branch', memberId: 'unknown' })).toBe(NEUTRAL_SERIES_COLOR);
  });

  it('colours an entity the same in every breakdown', () => {
    const annaIn = (breakdown: 'branch' | 'adviser') => {
      const tree = buildPivotTree(facts, breakdown);
      const anna =
        breakdown === 'branch'
          ? tree.children[0]?.children.find((n) => n.memberId === 'anna')
          : tree.children.find((n) => n.memberId === 'anna');
      return anna && colors.colorOf(anna);
    };
    expect(annaIn('branch')).toBe(annaIn('adviser'));
  });

  it('never cycles: series beyond the palette capacity fall back to the neutral colour', () => {
    const [template] = facts;
    if (!template) throw new Error('fixture has no facts');
    const manyBranches = Array.from({ length: BRANCH_COLORS.length + 1 }, (_, i) => ({
      ...template,
      branch: { id: `b${i}`, name: `B${i}` },
      adviser: { ...template.adviser, id: `adv${i}` },
    }));
    const wide = createSeriesColors(manyBranches);
    expect(wide.colorOf({ dimension: 'branch', memberId: `b${BRANCH_COLORS.length}` })).toBe(
      NEUTRAL_SERIES_COLOR,
    );
  });
});
