import { type ClientNode, findNodes } from './clientTree';

export type ClientType = 'existing' | 'organic' | 'paid';

export const CLIENT_TYPES: readonly { type: ClientType; label: string }[] = [
  { type: 'existing', label: 'Existing clients' },
  { type: 'organic', label: 'New organic' },
  { type: 'paid', label: 'New paid' },
];

export type ClientTypeTotals = Record<ClientType, number[]>;

/** Channel names in the payload that identify new clients (display labels may differ). */
const NEW_CLIENT_CHANNELS = { organic: 'New organic', paid: 'New paid' } as const;

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
  const channelsNamed = (name: string) =>
    findNodes(root, (node) => node.kind === 'channel' && node.name === name);

  const organic = sumByMonth(channelsNamed(NEW_CLIENT_CHANNELS.organic), monthCount);
  const paid = sumByMonth(channelsNamed(NEW_CLIENT_CHANNELS.paid), monthCount);
  const existing = root.values.map((total, month) =>
    Math.max(0, total - (organic[month] ?? 0) - (paid[month] ?? 0)),
  );

  return { existing, organic, paid };
}
