import { type ClientTypeId, clientTypeOfChannel } from '@nevis/shared';

import { type ClientNode, findNodes } from './clientTree';

export type ClientTypeTotals = Record<ClientTypeId, number[]>;

const sumByMonth = (nodes: readonly ClientNode[], monthCount: number): number[] =>
  Array.from({ length: monthCount }, (_, month) =>
    nodes.reduce((total, node) => total + (node.values[month] ?? 0), 0),
  );

/**
 * Splits a node's monthly totals by acquisition channel, as the design's chart does for the company.
 *
 * Channel breakdowns exist only for some employees, so:
 * - `organic` and `paid` are the sums of the channel rows with those names anywhere below `root`;
 * - `existing` is the remainder of `root`'s total, so each stack adds up to the figure in the table.
 *   Clients of employees without a channel breakdown therefore count as existing clients.
 */
export function computeClientTypeTotals(root: ClientNode): ClientTypeTotals {
  const monthCount = root.values.length;
  const channelsOfType = (type: ClientTypeId) =>
    findNodes(root, (node) => node.kind === 'channel' && clientTypeOfChannel(node.name) === type);

  const organic = sumByMonth(channelsOfType('organic'), monthCount);
  const paid = sumByMonth(channelsOfType('paid'), monthCount);
  const existing = root.values.map((total, month) =>
    Math.max(0, total - (organic[month] ?? 0) - (paid[month] ?? 0)),
  );

  return { existing, organic, paid };
}
