import { MONTH_COUNT, PERIOD_START } from '@nevis/shared';

interface YearMonth {
  year: number;
  /** 1-based month. */
  month: number;
}

export interface MonthColumn extends YearMonth {
  /** Stable ISO-like key, e.g. `2024-02`. */
  key: string;
  /** Display label, e.g. `Feb 2024`. */
  label: string;
  /** Month only, e.g. `Feb` – for compact layouts. */
  shortLabel: string;
  /** Position in each node's `values` array. */
  index: number;
}

export function buildMonthColumns(
  start: YearMonth = PERIOD_START,
  count: number = MONTH_COUNT,
  locale = 'en-US',
): MonthColumn[] {
  // UTC avoids the label shifting a month for users west of Greenwich.
  const format = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const formatShort = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(start.year, start.month - 1 + index, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    return {
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: format.format(date),
      shortLabel: formatShort.format(date),
      year,
      month,
      index,
    };
  });
}
