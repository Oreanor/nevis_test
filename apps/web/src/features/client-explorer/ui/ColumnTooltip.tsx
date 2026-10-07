import { clsx } from 'clsx';

import { formatInteger } from '@/shared/lib/format';
import { type StackedSegment, Swatch } from '@/shared/ui/chart';

interface ColumnTooltipProps {
  title: string;
  /** This month's segments, bottom of the stack first. */
  segments: readonly StackedSegment[];
  /** Segment under the pointer, emphasised in the list. */
  hoveredSeriesKey: string | null;
  /** Opens towards the left near the right edge so it is not cut off. */
  align: 'start' | 'end';
}

/** Values of one month, shown while the pointer is over its column (the table holds the same numbers). */
export function ColumnTooltip({ title, segments, hoveredSeriesKey, align }: ColumnTooltipProps) {
  const total = segments.at(-1)?.y1 ?? 0;
  // Top of the stack first, so the list reads in the same order as the bar.
  const rows = [...segments].reverse();

  return (
    <div
      className={clsx(
        'pointer-events-none absolute top-2 z-10 w-max max-w-64 rounded-md bg-surface p-2 text-footnote shadow-lg ring-1 ring-line',
        align === 'start' ? 'left-1/2' : 'right-1/2',
      )}
    >
      <p className="mb-1 font-medium text-ink">{title}</p>
      <ul className="flex flex-col gap-0.5">
        {rows.map((segment) => (
          <li
            key={segment.series.key}
            className={clsx(
              'flex items-center gap-1.5',
              hoveredSeriesKey === null || hoveredSeriesKey === segment.series.key
                ? 'text-ink'
                : 'text-muted',
              hoveredSeriesKey === segment.series.key && 'font-medium',
            )}
          >
            <Swatch color={segment.series.color} />
            <span className="min-w-0 flex-1 truncate">{segment.series.label}</span>
            <span className="tabular-nums">{formatInteger(segment.value)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 flex justify-between gap-4 border-t border-line pt-1 text-ink">
        <span>Total</span>
        <span className="tabular-nums">{formatInteger(total)}</span>
      </p>
    </div>
  );
}
