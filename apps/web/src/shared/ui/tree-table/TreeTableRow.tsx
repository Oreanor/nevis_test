import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import type { FlatRow } from './flattenTree';
import {
  alignClass,
  bodyCellClasses,
  cellBackground,
  rowHeightClass,
  selectedHierarchyCellClass,
} from './treeTableStyles';
import { TreeToggle } from './TreeToggle';
import type { TreeTableColumn, TreeTableRowState } from './types';
import type { TreeGridRowProps } from './useTreeGridFocus';

interface TreeTableRowProps<T> {
  flatRow: FlatRow<T>;
  columns: readonly TreeTableColumn<T>[];
  /** Interaction props from `useTreeGridFocus` (tab stop, keyboard, click). */
  interaction: TreeGridRowProps;
  label: string;
  /** `undefined` when the table has no selection; otherwise whether this row is the selected one. */
  isSelected?: boolean;
  /** Emphasised from outside the table (e.g. hovered in a linked chart). */
  isHighlighted?: boolean;
  /** Column emphasised from outside the table. */
  highlightedColumnId?: string | null;
  onToggle: () => void;
  children: (state: TreeTableRowState) => ReactNode;
}

/** One treegrid row: ARIA hierarchy attributes, indentation, toggle and value cells. */
export function TreeTableRow<T>({
  flatRow,
  columns,
  interaction,
  label,
  isSelected,
  isHighlighted = false,
  highlightedColumnId = null,
  onToggle,
  children,
}: TreeTableRowProps<T>) {
  const { row, level, posInSet, setSize, isExpandable, isExpanded } = flatRow;

  return (
    <tr
      {...interaction}
      aria-level={level}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-expanded={isExpandable ? isExpanded : undefined}
      aria-selected={isSelected !== undefined && isExpandable ? isSelected : undefined}
      className={clsx(
        'group outline-none',
        rowHeightClass,
        isExpandable ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <th
        scope="row"
        className={clsx(
          bodyCellClasses.hierarchy,
          isSelected
            ? [cellBackground.selected, selectedHierarchyCellClass]
            : isHighlighted
              ? cellBackground.highlighted
              : cellBackground.hierarchy,
        )}
      >
        <div
          className="flex items-center gap-1.5 sm:gap-2"
          style={{ paddingLeft: `calc(${level - 1} * var(--tree-indent))` }}
        >
          {isExpandable ? (
            <TreeToggle isExpanded={isExpanded} label={label} onToggle={onToggle} />
          ) : (
            <span className="w-4 shrink-0" aria-hidden="true" />
          )}
          {children({ level, isExpandable, isExpanded })}
        </div>
      </th>
      {columns.map((column) => (
        <td
          key={column.id}
          role="gridcell"
          className={clsx(
            bodyCellClasses.value,
            isSelected
              ? cellBackground.selected
              : isHighlighted || column.id === highlightedColumnId
                ? cellBackground.highlighted
                : cellBackground.value,
            alignClass[column.align ?? 'end'],
            column.className,
          )}
        >
          {column.cell(row)}
        </td>
      ))}
    </tr>
  );
}
