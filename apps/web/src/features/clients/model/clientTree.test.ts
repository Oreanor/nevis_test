import { describe, expect, it } from 'vitest';

import { companyFixture } from '../testing/companyFixture';
import { findNodes, toClientTree } from './clientTree';

describe('toClientTree', () => {
  const tree = toClientTree(companyFixture);

  it('maps every payload level to a uniform node with a kind', () => {
    expect(tree).toMatchObject({ id: 'company', kind: 'company', values: companyFixture.values });
    expect(tree.children.map((n) => [n.name, n.kind])).toEqual([
      ['Branch 1', 'branch'],
      ['Branch 2', 'branch'],
    ]);
    expect(tree.children[0]?.children.map((n) => n.kind)).toEqual(['employee', 'employee']);
    expect(tree.children[0]?.children[0]?.children.map((n) => [n.name, n.kind])).toEqual([
      ['Existing clients', 'channel'],
      ['New organic', 'channel'],
      ['New paid', 'channel'],
    ]);
  });

  it('turns missing child arrays into empty children (leaves)', () => {
    expect(tree.children[1]?.children).toEqual([]);
    expect(tree.children[0]?.children[1]?.children).toEqual([]);
  });

  it('keeps avatar URLs on employees only', () => {
    const [anna, james] = tree.children[0]?.children ?? [];
    expect(anna?.avatarUrl).toBe('/avatars/anna.svg');
    expect(james).not.toHaveProperty('avatarUrl');
  });
});

describe('findNodes', () => {
  it('collects matching nodes depth-first across the whole tree', () => {
    const tree = toClientTree(companyFixture);
    expect(findNodes(tree, (n) => n.kind === 'employee').map((n) => n.name)).toEqual([
      'Anna Blackwood',
      'James Walker',
    ]);
  });
});
