import type { MonthColumn } from '@/shared/lib/months';
import type { ChartDatum, ChartSeries } from '@/shared/ui/chart';

import type { ClientNode } from '../model/clientTree';
import { CLIENT_TYPES, type ClientType, computeClientTypeTotals } from '../model/clientTypes';

const SERIES_COLOR: Record<ClientType, string> = {
  existing: 'var(--color-series-existing)',
  organic: 'var(--color-series-organic)',
  paid: 'var(--color-series-paid)',
};

const CLIENT_TYPE_SERIES: readonly ChartSeries[] = CLIENT_TYPES.map(({ type, label }) => ({
  key: type,
  label,
  color: SERIES_COLOR[type],
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
    values: Object.fromEntries(CLIENT_TYPES.map(({ type }) => [type, totals[type][month.index] ?? 0])),
  }));

  return { data, series: CLIENT_TYPE_SERIES };
}
