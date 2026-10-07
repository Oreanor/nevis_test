import { clsx } from 'clsx';
import { useId } from 'react';

import { type ChartSeries, Swatch } from '@/shared/ui/chart';

/** Above this many series a plain list stops helping; colours are identified by hovering instead. */
const MAX_LISTED_SERIES = 6;

interface SeriesLegendProps {
  series: readonly ChartSeries[];
  /** What the colours stand for, e.g. "Client types"; the legend's title. */
  title: string;
  /** Singular noun for one series, e.g. "adviser", used when the list is too long to show. */
  seriesNoun: string;
  /** Series to emphasise (e.g. the hovered row). */
  highlightedKey?: string | null;
  /** Pointer over an entry (or `null` when it leaves the legend), to highlight that series elsewhere. */
  onHoverChange?: (seriesKey: string | null) => void;
  className?: string;
}

export function SeriesLegend({
  series,
  title,
  seriesNoun,
  highlightedKey = null,
  onHoverChange,
  className,
}: SeriesLegendProps) {
  const titleId = useId();

  return (
    <div className={clsx('flex min-w-0 flex-col gap-1.5', className)}>
      <p id={titleId} className="text-footnote text-muted">
        {title}
      </p>
      {series.length > MAX_LISTED_SERIES ? (
        <p className="text-footnote text-ink">
          Each colour is one {seriesNoun}. Hover a bar or its row to see which.
        </p>
      ) : (
        <ul
          aria-labelledby={titleId}
          onMouseLeave={onHoverChange && (() => onHoverChange(null))}
          className="flex flex-row flex-wrap gap-x-3 gap-y-1 text-footnote sm:flex-col sm:gap-x-0"
        >
          {series.map((s) => (
            <li
              key={s.key}
              onMouseEnter={onHoverChange && (() => onHoverChange(s.key))}
              className={clsx(
                'flex min-w-0 cursor-default items-center gap-1.5',
                highlightedKey === null || highlightedKey === s.key ? 'text-ink' : 'text-muted',
              )}
            >
              <Swatch color={s.color} />
              <span className="truncate">{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
