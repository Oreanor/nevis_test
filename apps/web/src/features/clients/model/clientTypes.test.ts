import { describe, expect, it } from 'vitest';

import { companyFixture } from '../testing/companyFixture';
import { type ClientNode, toClientTree } from './clientTree';
import { computeClientTypeTotals } from './clientTypes';

describe('computeClientTypeTotals', () => {
  const tree = toClientTree(companyFixture);

  it('sums new clients from channel rows anywhere in the tree', () => {
    const totals = computeClientTypeTotals(tree);
    expect(totals.organic.slice(0, 3)).toEqual([3, 3, 4]);
    expect(totals.paid.slice(0, 3)).toEqual([1, 2, 2]);
  });

  it('counts the rest of the total as existing clients, so stacks add up to the table figure', () => {
    const totals = computeClientTypeTotals(tree);

    expect(totals.existing[0]).toBe(100 - 3 - 1);
    tree.values.forEach((total, month) => {
      expect((totals.existing[month] ?? 0) + (totals.organic[month] ?? 0) + (totals.paid[month] ?? 0)).toBe(
        total,
      );
    });
  });

  it('works for any subtree, e.g. a single employee', () => {
    const anna = tree.children[0]?.children[0] as ClientNode;
    const totals = computeClientTypeTotals(anna);
    expect(totals.existing[0]).toBe(26);
  });

  it('treats a node without channels as existing clients only', () => {
    const branch2 = tree.children[1] as ClientNode;
    const totals = computeClientTypeTotals(branch2);
    expect(totals.existing).toEqual(branch2.values);
    expect(totals.organic.every((v) => v === 0)).toBe(true);
  });

  it('never produces negative existing clients when channels exceed the total', () => {
    const odd: ClientNode = {
      id: 'x',
      name: 'X',
      kind: 'employee',
      values: [1],
      children: [{ id: 'c', name: 'New paid', kind: 'channel', values: [5], children: [] }],
    };
    expect(computeClientTypeTotals(odd).existing).toEqual([0]);
  });
});
