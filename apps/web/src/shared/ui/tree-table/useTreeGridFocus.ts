import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';

import { findVisibleAncestor, type FlatRow } from './flattenTree';
import { resolveTreeKey } from './treeKeyboard';

/** Clicks on these handle themselves and must not also toggle the row. */
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]';

export interface TreeGridRowProps {
  'data-row-id': string;
  tabIndex: number;
  onFocus: (event: FocusEvent<HTMLTableRowElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => void;
  onMouseEnter: () => void;
  onClick?: (event: MouseEvent<HTMLTableRowElement>) => void;
}

interface TreeGridBodyProps {
  onMouseLeave: () => void;
}

interface TreeGridProps {
  onBlur: (event: FocusEvent<HTMLTableElement>) => void;
}

interface TreeGridFocusOptions<T> {
  rows: readonly FlatRow<T>[];
  parents: ReadonlyMap<string, string | null>;
  setExpanded: (id: string, expanded: boolean) => void;
  /** Enables selection of rows with children: click and Enter select (and expand), Space toggles. */
  onSelect?: (id: string) => void;
  /** The row under the pointer, else the focused row while focus is inside the grid, else `null`. */
  onActiveRowChange?: (id: string | null) => void;
}

/**
 * Roving-tabindex focus and interaction for a treegrid (WAI-ARIA, row-focus mode): one row is the tab
 * stop, arrow keys move/expand/collapse, and clicking an expandable row toggles (or selects) it.
 */
export function useTreeGridFocus<T>({
  rows,
  parents,
  setExpanded,
  onSelect,
  onActiveRowChange,
}: TreeGridFocusOptions<T>) {
  const gridRef = useRef<HTMLTableElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectable = onSelect !== undefined;

  // If the active row got hidden by collapsing an ancestor, the tab stop moves up to that ancestor.
  const visibleIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows]);
  const tabStopId =
    (activeId !== null ? findVisibleAncestor(activeId, visibleIds, parents) : null) ?? rows[0]?.id ?? null;

  const reportedActiveId = hoveredId ?? (hasFocus ? tabStopId : null);
  const reportActiveRow = useEffectEvent((id: string | null) => onActiveRowChange?.(id));
  useEffect(() => {
    reportActiveRow(reportedActiveId);
  }, [reportedActiveId]);

  const focusRow = (id: string) => {
    setActiveId(id);
    const rowElements = gridRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-row-id]') ?? [];
    [...rowElements].find((element) => element.dataset.rowId === id)?.focus();
  };

  /** Toggles a row from its chevron and makes it the tab stop. */
  const toggleRow = (row: FlatRow<T>) => {
    setActiveId(row.id);
    setExpanded(row.id, !row.isExpanded);
  };

  const selectRow = (id: string) => {
    setActiveId(id);
    onSelect?.(id);
    setExpanded(id, true);
  };

  const getRowProps = (row: FlatRow<T>, index: number): TreeGridRowProps => ({
    'data-row-id': row.id,
    tabIndex: row.id === tabStopId ? 0 : -1,
    onFocus: (event) => {
      if (event.target !== event.currentTarget) return;
      setActiveId(row.id);
      setHasFocus(true);
    },
    onMouseEnter: () => setHoveredId(row.id),
    onKeyDown: (event) => {
      // Enter/Space on a button inside the row already clicks it; don't toggle twice.
      if (event.target !== event.currentTarget && (event.key === 'Enter' || event.key === ' ')) return;

      const action = resolveTreeKey(event.key, index, rows, { selectable });
      if (!action) return;
      event.preventDefault();

      if (action.type === 'focus') focusRow(action.id);
      else if (action.type === 'select') selectRow(action.id);
      else setExpanded(action.id, action.type === 'expand');
    },
    onClick: row.isExpandable
      ? (event) => {
          if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
          // Finishing a text selection (e.g. copying a figure) should not toggle the row.
          if (window.getSelection()?.isCollapsed === false) return;
          if (selectable) selectRow(row.id);
          else toggleRow(row);
        }
      : undefined,
  });

  const bodyProps: TreeGridBodyProps = { onMouseLeave: () => setHoveredId(null) };
  const gridProps: TreeGridProps = {
    onBlur: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
    },
  };

  return { gridRef, gridProps, bodyProps, getRowProps, toggleRow };
}
