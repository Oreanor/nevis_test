import { describe, expect, it } from 'vitest';

import { explorerFixture } from '../testing/explorerFixture';
import { parseView, toSearchParams } from './explorerView';
import { toFacts } from './facts';
import { buildPivotTree, findPath, TOTAL_ID } from './pivot';
import { buildScopeChart, resolveHighlight } from './scopeChart';
import { createSeriesColors } from './seriesColors';

const facts = toFacts(explorerFixture);
const tree = buildPivotTree(facts, 'branch');
const colors = createSeriesColors(facts);
const nodeById = (id: string) => findPath(tree, id).at(-1);

describe('buildScopeChart', () => {
  it('splits the total by its children, one stack per month', () => {
    const chart = buildScopeChart(tree, colors);

    expect(chart.series.map((s) => s.label)).toEqual(['Branch A', 'Branch B', 'Branch C']);
    expect(chart.stacks).toHaveLength(2);
    expect(chart.stacks[0]?.map((segment) => segment.value)).toEqual([60, 30, 10]);
    expect(chart.stacks[1]?.at(-1)?.y1).toBe(110);
  });

  it('re-scopes to a selected row and colours series by entity', () => {
    const branchA = nodeById('total/branch:a');
    if (!branchA) throw new Error('missing node');
    const chart = buildScopeChart(branchA, colors);

    expect(chart.series.map((s) => s.label)).toEqual(['Anna', 'James']);
    expect(chart.series[0]?.color).toBe(colors.colorOf({ dimension: 'adviser', memberId: 'anna' }));
  });
});

describe('resolveHighlight', () => {
  it('emphasises a row that is a series of the chart', () => {
    expect(resolveHighlight(tree, TOTAL_ID, 'total/branch:b')).toEqual({ seriesKey: 'total/branch:b' });
  });

  it('marks the part of a deeper row inside its series', () => {
    expect(resolveHighlight(tree, TOTAL_ID, 'total/branch:a/adviser:james/clientType:paid')).toEqual({
      seriesKey: 'total/branch:a',
      partValues: [2, 2],
    });
  });

  it('ignores the scope itself, rows outside it and no active row', () => {
    const scope = 'total/branch:a';
    expect(resolveHighlight(tree, scope, scope)).toBeNull();
    expect(resolveHighlight(tree, scope, 'total/branch:b/adviser:olivia')).toBeNull();
    expect(resolveHighlight(tree, scope, null)).toBeNull();
  });
});

describe('explorer view in the URL', () => {
  it('round-trips and keeps default values out of the URL', () => {
    const view = { breakdown: 'adviser' as const, scopeId: 'total/adviser:anna' };
    expect(parseView(toSearchParams(view))).toEqual(view);
    expect(toSearchParams({ breakdown: 'branch', scopeId: TOTAL_ID }).toString()).toBe('');
  });

  it('falls back to defaults for invalid values', () => {
    expect(parseView(new URLSearchParams('by=nope'))).toEqual({ breakdown: 'branch', scopeId: TOTAL_ID });
  });
});
