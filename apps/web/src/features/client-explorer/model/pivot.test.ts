import { describe, expect, it } from 'vitest';

import { explorerFixture } from '../testing/explorerFixture';
import { toFacts } from './facts';
import { adviserChoices, type Breakdown, buildPivotTree, findPath, type PivotNode, TOTAL_ID } from './pivot';

const facts = toFacts(explorerFixture);

/** Compact outline: `name values` per node, indented by depth. */
function outline(node: PivotNode, depth = 0): string[] {
  const line = `${'  '.repeat(depth)}${node.name}${node.context ? ` (${node.context})` : ''} ${node.values.join(',')}`;
  return [line, ...node.children.flatMap((child) => outline(child, depth + 1))];
}

describe('buildPivotTree', () => {
  it('breaks down by branch → adviser → client type', () => {
    expect(outline(buildPivotTree(facts, 'branch'))).toEqual([
      'All clients 100,110',
      '  Branch A 60,66',
      '    Anna 40,44',
      '      Existing clients 30,32',
      '      New organic 6,7',
      '      New paid 4,5',
      '    James 20,22',
      '      Existing clients 16,17',
      '      New organic 2,3',
      '      New paid 2,2',
      '  Branch B 30,32',
      '    Olivia 30,32',
      '      Not specified 30,32',
      '  Branch C 10,12',
      '    Unassigned 10,12',
      '      Not specified 10,12',
    ]);
  });

  it('breaks down by client type → branch → adviser', () => {
    expect(outline(buildPivotTree(facts, 'clientType')).slice(0, 7)).toEqual([
      'All clients 100,110',
      '  Existing clients 46,49',
      '    Branch A 46,49',
      '      Anna 30,32',
      '      James 16,17',
      '  New organic 8,10',
      '    Branch A 8,10',
    ]);
  });

  it('breaks down by adviser → client type, naming the branch next to each adviser', () => {
    expect(outline(buildPivotTree(facts, 'adviser')).slice(0, 6)).toEqual([
      'All clients 100,110',
      '  Anna (Branch A) 40,44',
      '    Existing clients 30,32',
      '    New organic 6,7',
      '    New paid 4,5',
      '  James (Branch A) 20,22',
    ]);
  });

  it.each<Breakdown>(['branch', 'clientType', 'adviser'])(
    'keeps every parent equal to the sum of its children (%s)',
    (breakdown) => {
      const check = (node: PivotNode) => {
        if (node.children.length) {
          const sums = node.values.map((_, m) => node.children.reduce((s, c) => s + (c.values[m] ?? 0), 0));
          expect(node.values, node.id).toEqual(sums);
        }
        node.children.forEach(check);
      };
      check(buildPivotTree(facts, breakdown));
    },
  );

  it('uses stable path ids and keeps avatars on adviser nodes', () => {
    const anna = buildPivotTree(facts, 'branch').children[0]?.children[0];
    expect(anna).toMatchObject({
      id: 'total/branch:a/adviser:anna',
      dimension: 'adviser',
      avatarUrl: '/avatars/anna.png',
    });
    expect(anna).not.toHaveProperty('context');
  });
});

describe('findPath', () => {
  const tree = buildPivotTree(facts, 'branch');

  it('returns the nodes from the root to the target', () => {
    expect(findPath(tree, 'total/branch:a/adviser:james').map((n) => n.name)).toEqual([
      'All clients',
      'Branch A',
      'James',
    ]);
    expect(findPath(tree, TOTAL_ID)).toEqual([tree]);
  });

  it('returns an empty path for unknown ids', () => {
    expect(findPath(tree, 'total/branch:zzz')).toEqual([]);
  });
});

describe('adviserChoices', () => {
  const names = (nodes: readonly PivotNode[] | undefined) => nodes?.map((n) => n.name);

  it("offers a scope's advisers when the chart splits by adviser", () => {
    const tree = buildPivotTree(facts, 'branch');
    const choices = adviserChoices(findPath(tree, 'total/branch:a'));
    expect(names(choices?.advisers)).toEqual(['Anna', 'James']);
    expect(choices?.selectedId).toBeNull();
  });

  it('keeps offering the siblings once an adviser is the scope', () => {
    const tree = buildPivotTree(facts, 'adviser');
    const choices = adviserChoices(findPath(tree, 'total/adviser:james'));
    expect(names(choices?.advisers)).toEqual(names(tree.children));
    expect(choices?.selectedId).toBe('total/adviser:james');
  });

  it('offers nothing where advisers are not in play', () => {
    const tree = buildPivotTree(facts, 'branch');
    expect(adviserChoices([tree])).toBeNull();
  });
});
