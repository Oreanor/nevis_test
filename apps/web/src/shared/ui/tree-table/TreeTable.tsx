import { clsx } from 'clsx';
import { type CSSProperties, type ReactNode, useMemo } from 'react';

import { buildParentIndex, flattenVisibleRows, type TreeAccessors } from './flattenTree';
import { TreeTableHeader } from './TreeTableHeader';
import { TreeTableRow } from './TreeTableRow';
import type { TreeTableColumn, TreeTableRowState } from './types';
import { type TreeExpansionOptions, useTreeExpansion } from './useTreeExpansion';
import { useTreeGridFocus } from './useTreeGridFocus';

export interface TreeTableProps<T> extends TreeAccessors<T>, TreeExpansionOptions {
  data: readonly T[];
  columns: readonly TreeTableColumn<T>[];
  /** Content of the hierarchy column (indentation and toggle are handled by the table). */
  renderRowHeader: (row: T, state: TreeTableRowState) => ReactNode;
  /** Plain-text row name, used for the toggle's accessible label. */
  getRowLabel: (row: T) => string;
  /** Accessible header of the hierarchy column; visually hidden like in the design. */
  rowHeaderLabel?: string;
  /**
   * Indentation per level as a CSS length. Defaults to 1rem on small screens and 1.75rem from `sm` up
   * (via the `--tree-indent` custom property).
   */
  indentSize?: string;
  /** Extra rows at the top of the header, sharing the table's columns (e.g. a chart aligned with them). */
  headerRows?: ReactNode;
  /** Keep the header (including `headerRows`) visible at the top of the scroll container. */
  stickyHeader?: boolean;
  /** Selected row id. Passing `onSelect` enables selection of rows that have children. */
  selectedId?: string | null;
  /** Click or Enter on a row with children selects (and expands) it; the chevron and Space only toggle. */
  onSelect?: (id: string) => void;
  /** Rows and columns emphasised from outside the table, e.g. by a linked chart. */
  highlightedRowId?: string | null;
  highlightedColumnId?: string | null;
  /** Row under the pointer, else the focused row while focus is in the table, else `null`. */
  onActiveRowChange?: (id: string | null) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

/**
 * Hierarchical data table following the WAI-ARIA treegrid pattern: rows expose level, position and
 * expanded state to assistive technology; one row is the tab stop and arrow keys move/expand/collapse.
 */
export function TreeTable<T>({
  data,
  columns,
  getRowId,
  getSubRows,
  renderRowHeader,
  getRowLabel,
  rowHeaderLabel = 'Name',
  indentSize,
  headerRows,
  stickyHeader = false,
  selectedId,
  onSelect,
  onActiveRowChange,
  highlightedRowId = null,
  highlightedColumnId = null,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds,
  onExpandedChange,
  className,
  ...ariaProps
}: TreeTableProps<T>) {
  const { expandedIds, setExpanded } = useTreeExpansion({
    expandedIds: controlledExpandedIds,
    defaultExpandedIds,
    onExpandedChange,
  });

  const rows = useMemo(
    () => flattenVisibleRows(data, { getRowId, getSubRows }, expandedIds),
    [data, getRowId, getSubRows, expandedIds],
  );
  const parents = useMemo(
    () => buildParentIndex(data, { getRowId, getSubRows }),
    [data, getRowId, getSubRows],
  );
  const { gridRef, gridProps, bodyProps, getRowProps, toggleRow } = useTreeGridFocus({
    rows,
    parents,
    setExpanded,
    onSelect,
    onActiveRowChange,
  });
  const selectable = onSelect !== undefined;

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table
        ref={gridRef}
        role="treegrid"
        className="w-full border-separate border-spacing-0 text-compact [--tree-indent:1rem] sm:text-body sm:[--tree-indent:1.75rem]"
        style={indentSize === undefined ? undefined : ({ '--tree-indent': indentSize } as CSSProperties)}
        {...gridProps}
        {...ariaProps}
      >
        <TreeTableHeader
          columns={columns}
          hierarchyLabel={rowHeaderLabel}
          extraRows={headerRows}
          sticky={stickyHeader}
          highlightedColumnId={highlightedColumnId}
        />
        <tbody {...bodyProps}>
          {rows.map((flatRow, index) => (
            <TreeTableRow
              key={flatRow.id}
              flatRow={flatRow}
              columns={columns}
              interaction={getRowProps(flatRow, index)}
              label={getRowLabel(flatRow.row)}
              isSelected={selectable ? flatRow.id === selectedId : undefined}
              isHighlighted={flatRow.id === highlightedRowId}
              highlightedColumnId={highlightedColumnId}
              onToggle={() => toggleRow(flatRow)}
            >
              {(state) => renderRowHeader(flatRow.row, state)}
            </TreeTableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}
