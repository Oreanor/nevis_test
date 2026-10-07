import { useCallback, useState } from 'react';

export interface TreeExpansionOptions {
  /** Controlled expanded row ids. */
  expandedIds?: ReadonlySet<string>;
  /** Initial expanded row ids when uncontrolled. */
  defaultExpandedIds?: Iterable<string>;
  onExpandedChange?: (expandedIds: ReadonlySet<string>) => void;
}

export interface TreeExpansion {
  expandedIds: ReadonlySet<string>;
  setExpanded: (id: string, expanded: boolean) => void;
}

/** Expansion state that works both controlled (`expandedIds`) and uncontrolled (`defaultExpandedIds`). */
export function useTreeExpansion({
  expandedIds: controlled,
  defaultExpandedIds,
  onExpandedChange,
}: TreeExpansionOptions = {}): TreeExpansion {
  const [uncontrolled, setUncontrolled] = useState<ReadonlySet<string>>(
    () => new Set(defaultExpandedIds ?? []),
  );
  const expandedIds = controlled ?? uncontrolled;

  const setExpanded = useCallback(
    (id: string, expanded: boolean) => {
      if (expandedIds.has(id) === expanded) return;
      const next = new Set(expandedIds);
      if (expanded) next.add(id);
      else next.delete(id);

      if (controlled === undefined) setUncontrolled(next);
      onExpandedChange?.(next);
    },
    [expandedIds, controlled, onExpandedChange],
  );

  return { expandedIds, setExpanded };
}
