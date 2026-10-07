import type { FlatRow } from './flattenTree';

export type TreeKeyAction =
  | { type: 'focus'; id: string }
  | { type: 'expand'; id: string }
  | { type: 'collapse'; id: string }
  | { type: 'select'; id: string };

interface TreeKeyOptions {
  /** Rows with children can be selected: Enter selects, Space toggles. Otherwise both toggle. */
  selectable?: boolean;
}

/**
 * Maps a key press on a focused row to an action, following the WAI-ARIA treegrid pattern
 * (row-focus mode): https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
 */
export function resolveTreeKey<T>(
  key: string,
  index: number,
  rows: readonly FlatRow<T>[],
  { selectable = false }: TreeKeyOptions = {},
): TreeKeyAction | null {
  const current = rows[index];
  if (!current) return null;

  const focus = (row: FlatRow<T> | undefined): TreeKeyAction | null =>
    row ? { type: 'focus', id: row.id } : null;
  const toggle = (): TreeKeyAction | null =>
    current.isExpandable ? { type: current.isExpanded ? 'collapse' : 'expand', id: current.id } : null;

  switch (key) {
    case 'ArrowDown':
      return focus(rows[index + 1]);
    case 'ArrowUp':
      return focus(rows[index - 1]);
    case 'Home':
      return focus(rows[0]);
    case 'End':
      return focus(rows.at(-1));
    case 'ArrowRight':
      if (!current.isExpandable) return null;
      // Children of an expanded row come right after it in the flat list.
      return current.isExpanded ? focus(rows[index + 1]) : { type: 'expand', id: current.id };
    case 'ArrowLeft':
      if (current.isExpanded) return { type: 'collapse', id: current.id };
      return current.parentId === null ? null : { type: 'focus', id: current.parentId };
    case 'Enter':
      if (selectable) return current.isExpandable ? { type: 'select', id: current.id } : null;
      return toggle();
    case ' ':
      return toggle();
    default:
      return null;
  }
}
