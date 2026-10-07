import { CLIENT_TYPES, type ClientTypeId } from '@nevis/shared';

import type { MonthColumn } from '@/shared/lib/months';
import type { ChartDatum, ChartSeries } from '@/shared/ui/chart';

import type { ClientNode } from '../model/clientTree';
import { computeClientTypeTotals } from '../model/clientTypes';

const SERIES_COLOR: Record<ClientTypeId, string> = {
  existing: 'var(--color-series-existing)',
  organic: 'var(--color-series-organic)',
  paid: 'var(--color-series-paid)',
};

const CLIENT_TYPE_SERIES: readonly ChartSeries[] = CLIENT_TYPES.map(({ id, channelName }) => ({
  key: id,
  label: channelName,
  color: SERIES_COLOR[id],
}));

/** Maps a client tree to one stacked bar per month, split by client type. */
export function toClientTypeChartData(
  root: ClientNode,
  months: readonly MonthColumn[],
): { data: ChartDatum[]; series: readonly ChartSeries[] } {
  const totals = computeClientTypeTotals(root);

  const data = months.map((month) => ({
    key: month.key,
    label: month.label,
    values: Object.fromEntries(CLIENT_TYPES.map(({ id }) => [id, totals[id][month.index] ?? 0])),
  }));

  return { data, series: CLIENT_TYPE_SERIES };
}
