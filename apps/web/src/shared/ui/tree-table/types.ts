import type { ReactNode } from 'react';

export interface TreeTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

export interface TreeTableRowState {
  level: number;
  isExpandable: boolean;
  isExpanded: boolean;
}
