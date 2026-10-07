import { useId, useMemo } from 'react';

import { formatInteger } from '@/shared/lib/format';
import type { MonthColumn } from '@/shared/lib/months';
import { Card } from '@/shared/ui/Card';
import { TreeTable, type TreeTableColumn, type TreeTableProps } from '@/shared/ui/tree-table';

import type { ClientNode } from '../model/clientTree';
import { ClientRowName } from './ClientRowName';

type ExpansionProps = Pick<
  TreeTableProps<ClientNode>,
  'expandedIds' | 'defaultExpandedIds' | 'onExpandedChange'
>;

interface ClientsTableProps extends ExpansionProps {
  root: ClientNode;
  months: readonly MonthColumn[];
}

const getRowId = (node: ClientNode) => node.id;
const getSubRows = (node: ClientNode) => node.children;
const getRowLabel = (node: ClientNode) => node.name;
const renderRowHeader = (node: ClientNode) => <ClientRowName node={node} />;

export function ClientsTable({ root, months, defaultExpandedIds, ...expansion }: ClientsTableProps) {
  const headingId = useId();
  const data = useMemo(() => [root], [root]);
  const columns = useMemo(
    (): TreeTableColumn<ClientNode>[] =>
      months.map((month) => ({
        id: month.key,
        header: month.label,
        cell: (node) => formatInteger(node.values[month.index] ?? 0),
      })),
    [months],
  );

  return (
    <Card aria-labelledby={headingId} className="overflow-hidden">
      <h2 id={headingId} className="sr-only">
        Clients per month by branch, adviser and channel
      </h2>
      <TreeTable
        aria-labelledby={headingId}
        data={data}
        columns={columns}
        getRowId={getRowId}
        getSubRows={getSubRows}
        getRowLabel={getRowLabel}
        renderRowHeader={renderRowHeader}
        defaultExpandedIds={defaultExpandedIds ?? [root.id]}
        {...expansion}
      />
    </Card>
  );
}
