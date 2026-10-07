import { clsx } from 'clsx';
import type { ReactNode, Ref } from 'react';

import { alignClass, headerCellClass, rowHeightClass } from './treeTableStyles';
import type { TreeTableColumn } from './types';

interface TreeTableHeaderProps<T> {
  columns: readonly TreeTableColumn<T>[];
  /** Accessible header of the hierarchy column; visually hidden like in the design. */
  hierarchyLabel: string;
  /** Extra rows above the column headers, aligned with the columns (e.g. a chart). */
  extraRows?: ReactNode;
  /** Stick to the top of the scroll container. */
  sticky?: boolean;
  /** Column emphasised from outside the table. */
  highlightedColumnId?: string | null;
  ref?: Ref<HTMLTableSectionElement>;
}

export function TreeTableHeader<T>({
  columns,
  hierarchyLabel,
  extraRows,
  sticky = false,
  highlightedColumnId = null,
  ref,
}: TreeTableHeaderProps<T>) {
  return (
    <thead ref={ref} className={clsx(sticky && 'sticky top-0 z-20')}>
      {extraRows}
      <tr className={rowHeightClass}>
        <th scope="col" className={headerCellClass.hierarchy}>
          <span className="sr-only">{hierarchyLabel}</span>
        </th>
        {columns.map((column) => (
          <th
            key={column.id}
            scope="col"
            className={clsx(
              headerCellClass.value,
              column.id === highlightedColumnId && 'text-ink',
              alignClass[column.align ?? 'end'],
              column.className,
            )}
          >
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
