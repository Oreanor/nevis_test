import { describe, expect, it } from 'vitest';

import { flattenVisibleRows } from './flattenTree';
import { testAccessors, testTree } from './testTree';
import { resolveTreeKey } from './treeKeyboard';

// Visible: root, a (expanded), a1 (collapsed, has children), a2 (leaf), b (leaf)
const rows = flattenVisibleRows(testTree, testAccessors, new Set(['root', 'a']));
const indexOf = (id: string) => rows.findIndex((r) => r.id === id);
const press = (key: string, id: string) => resolveTreeKey(key, indexOf(id), rows);

describe('resolveTreeKey', () => {
  it('moves between visible rows with ArrowUp/ArrowDown and stops at the edges', () => {
    expect(press('ArrowDown', 'a')).toEqual({ type: 'focus', id: 'a1' });
    expect(press('ArrowUp', 'a1')).toEqual({ type: 'focus', id: 'a' });
    expect(press('ArrowUp', 'root')).toBeNull();
    expect(press('ArrowDown', 'b')).toBeNull();
  });

  it('jumps to the first and last row with Home/End', () => {
    expect(press('Home', 'a2')).toEqual({ type: 'focus', id: 'root' });
    expect(press('End', 'root')).toEqual({ type: 'focus', id: 'b' });
  });

  it('ArrowRight expands a collapsed row, then moves into its first child', () => {
    expect(press('ArrowRight', 'a1')).toEqual({ type: 'expand', id: 'a1' });
    expect(press('ArrowRight', 'a')).toEqual({ type: 'focus', id: 'a1' });
    expect(press('ArrowRight', 'b')).toBeNull();
  });

  it('ArrowLeft collapses an expanded row, otherwise moves to the parent', () => {
    expect(press('ArrowLeft', 'a')).toEqual({ type: 'collapse', id: 'a' });
    expect(press('ArrowLeft', 'a2')).toEqual({ type: 'focus', id: 'a' });
    expect(press('ArrowLeft', 'a1')).toEqual({ type: 'focus', id: 'a' });
  });

  it('ArrowLeft on a collapsed root does nothing', () => {
    const collapsed = flattenVisibleRows(testTree, testAccessors, new Set());
    expect(resolveTreeKey('ArrowLeft', 0, collapsed)).toBeNull();
  });

  it('Enter and Space toggle expandable rows only', () => {
    expect(press('Enter', 'a')).toEqual({ type: 'collapse', id: 'a' });
    expect(press(' ', 'a1')).toEqual({ type: 'expand', id: 'a1' });
    expect(press('Enter', 'b')).toBeNull();
  });

  it('ignores unrelated keys and invalid indexes', () => {
    expect(press('a', 'a')).toBeNull();
    expect(resolveTreeKey('ArrowDown', 99, rows)).toBeNull();
  });

  describe('with selection', () => {
    const select = (key: string, id: string) => resolveTreeKey(key, indexOf(id), rows, { selectable: true });

    it('Enter selects rows with children and ignores leaves', () => {
      expect(select('Enter', 'a')).toEqual({ type: 'select', id: 'a' });
      expect(select('Enter', 'b')).toBeNull();
    });

    it('Space still toggles', () => {
      expect(select(' ', 'a')).toEqual({ type: 'collapse', id: 'a' });
      expect(select(' ', 'a1')).toEqual({ type: 'expand', id: 'a1' });
    });
  });
});
