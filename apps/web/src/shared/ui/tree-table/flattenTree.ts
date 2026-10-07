export interface TreeAccessors<T> {
  getRowId: (row: T) => string;
  /** Children of a row; `undefined` or empty means the row is a leaf. */
  getSubRows: (row: T) => readonly T[] | undefined;
}

export interface FlatRow<T> {
  id: string;
  row: T;
  /** 1-based depth, as in `aria-level`. */
  level: number;
  parentId: string | null;
  /** 1-based position among siblings, as in `aria-posinset`. */
  posInSet: number;
  setSize: number;
  isExpandable: boolean;
  isExpanded: boolean;
}

/** Depth-first list of the rows that are currently visible (children of collapsed rows are skipped). */
export function flattenVisibleRows<T>(
  roots: readonly T[],
  { getRowId, getSubRows }: TreeAccessors<T>,
  expandedIds: ReadonlySet<string>,
): FlatRow<T>[] {
  const result: FlatRow<T>[] = [];

  const visit = (rows: readonly T[], level: number, parentId: string | null) => {
    rows.forEach((row, index) => {
      const id = getRowId(row);
      const children = getSubRows(row) ?? [];
      const isExpandable = children.length > 0;
      const isExpanded = isExpandable && expandedIds.has(id);

      result.push({
        id,
        row,
        level,
        parentId,
        posInSet: index + 1,
        setSize: rows.length,
        isExpandable,
        isExpanded,
      });
      if (isExpanded) visit(children, level + 1, id);
    });
  };

  visit(roots, 1, null);
  return result;
}

/** Parent id of every row in the tree, including currently hidden ones. */
export function buildParentIndex<T>(
  roots: readonly T[],
  { getRowId, getSubRows }: TreeAccessors<T>,
): ReadonlyMap<string, string | null> {
  const parents = new Map<string, string | null>();

  const visit = (rows: readonly T[], parentId: string | null) => {
    for (const row of rows) {
      const id = getRowId(row);
      parents.set(id, parentId);
      visit(getSubRows(row) ?? [], id);
    }
  };

  visit(roots, null);
  return parents;
}

/** The row itself if visible, otherwise its closest visible ancestor. */
export function findVisibleAncestor(
  id: string,
  visibleIds: ReadonlySet<string>,
  parents: ReadonlyMap<string, string | null>,
): string | null {
  let current: string | null | undefined = id;
  while (current != null) {
    if (visibleIds.has(current)) return current;
    current = parents.get(current);
  }
  return null;
}
