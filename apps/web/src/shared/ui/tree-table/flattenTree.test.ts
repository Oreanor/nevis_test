import { describe, expect, it } from 'vitest';

import { buildParentIndex, findVisibleAncestor, flattenVisibleRows } from './flattenTree';
import { testAccessors, testTree } from './testTree';

const flatten = (expanded: string[]) => flattenVisibleRows(testTree, testAccessors, new Set(expanded));

describe('flattenVisibleRows', () => {
  it('shows only roots when nothing is expanded', () => {
    expect(flatten([]).map((r) => r.id)).toEqual(['root']);
  });

  it('reveals children of expanded rows in depth-first order', () => {
    expect(flatten(['root', 'a']).map((r) => r.id)).toEqual(['root', 'a', 'a1', 'a2', 'b']);
  });

  it('keeps descendants hidden when an ancestor is collapsed', () => {
    expect(flatten(['a', 'a1']).map((r) => r.id)).toEqual(['root']);
  });

  it('computes ARIA metadata: level, position and set size', () => {
    const rows = flatten(['root', 'a']);
    expect(
      rows.map(({ id, level, posInSet, setSize, parentId }) => ({ id, level, posInSet, setSize, parentId })),
    ).toEqual([
      { id: 'root', level: 1, posInSet: 1, setSize: 1, parentId: null },
      { id: 'a', level: 2, posInSet: 1, setSize: 2, parentId: 'root' },
      { id: 'a1', level: 3, posInSet: 1, setSize: 2, parentId: 'a' },
      { id: 'a2', level: 3, posInSet: 2, setSize: 2, parentId: 'a' },
      { id: 'b', level: 2, posInSet: 2, setSize: 2, parentId: 'root' },
    ]);
  });

  it('treats rows without children as non-expandable even if their id is expanded', () => {
    const b = flatten(['root', 'b']).find((r) => r.id === 'b');
    expect(b).toMatchObject({ isExpandable: false, isExpanded: false });
  });
});

describe('findVisibleAncestor', () => {
  const parents = buildParentIndex(testTree, testAccessors);

  it('returns the row itself when visible', () => {
    expect(findVisibleAncestor('a', new Set(['root', 'a']), parents)).toBe('a');
  });

  it('walks up to the closest visible ancestor', () => {
    expect(findVisibleAncestor('a1x', new Set(['root', 'a']), parents)).toBe('a');
  });

  it('returns null for unknown rows', () => {
    expect(findVisibleAncestor('nope', new Set(['root']), parents)).toBeNull();
  });
});
