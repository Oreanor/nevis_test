import { clsx } from 'clsx';
import { useId } from 'react';

import type { ChartSeries } from '@/shared/ui/chart';
import { Combobox } from '@/shared/ui/Combobox';

/** Above this many series a plain list stops helping; colours are identified by hovering instead. */
const MAX_LISTED_SERIES = 6;

interface SeriesLegendProps {
  series: readonly ChartSeries[];
  /** What the colours stand for, e.g. "Advisers"; the legend's title. */
  title: string;
  /** Singular noun for one series, e.g. "adviser", used when the list is too long to show. */
  seriesNoun: string;
  /** Series to emphasise (e.g. the hovered row). */
  highlightedKey?: string | null;
  /** Pointer (or keyboard, when searchable) over an entry, `null` when it leaves; highlights the series. */
  onHoverChange?: (seriesKey: string | null) => void;
  /** Render as a searchable list (for many series, e.g. all advisers); picking an entry calls `onPick`. */
  searchable?: boolean;
  onPick?: (seriesKey: string) => void;
  /** Secondary text per entry in the searchable list, e.g. the adviser's branch. */
  getDescription?: (seriesKey: string) => string | undefined;
  className?: string;
}

const Swatch = ({ color }: { color: string }) => (
  <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
);

export function SeriesLegend({
  series,
  title,
  seriesNoun,
  highlightedKey = null,
  onHoverChange,
  searchable = false,
  onPick,
  getDescription,
  className,
}: SeriesLegendProps) {
  const titleId = useId();

  if (searchable) {
    return (
      <Combobox
        className={className}
        label={title}
        placeholder={`Find ${/^[aeiou]/i.test(seriesNoun) ? 'an' : 'a'} ${seriesNoun}…`}
        options={series.map((s) => ({
          id: s.key,
          label: s.label,
          description: getDescription?.(s.key),
          icon: <Swatch color={s.color} />,
        }))}
        value={null}
        onChange={(key) => onPick?.(key)}
        onActiveChange={onHoverChange}
      />
    );
  }

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
                'flex min-w-0 items-center gap-1.5',
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
