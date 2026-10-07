import { clsx } from 'clsx';
import { useId } from 'react';

import type { StackedSegment } from '../types';
import type { StackScale } from './stackScale';

export interface StackOverlay {
  /** Series whose segment contains the highlighted part. */
  seriesKey: string;
  /** Size of the part, drawn from the bottom of that segment. */
  value: number;
}

interface ColumnStackProps {
  /** Segments of this column, bottom to top (from `stackData`). */
  segments: readonly StackedSegment[];
  scale: StackScale;
  /** Bar width as a fraction of the cell width. */
  barWidth?: number;
  /** Corner radius of the whole bar, applied by clipping. */
  radius?: number;
  /** When set, other series are dimmed. */
  highlightedSeries?: string | null;
  /** Marks a part of one segment (e.g. a row deeper in the hierarchy). */
  overlay?: StackOverlay | null;
  /** Draw dotted grid lines at the scale's ticks. */
  gridLines?: boolean;
  onSegmentEnter?: (segment: StackedSegment) => void;
  onSegmentLeave?: () => void;
  className?: string;
}

/**
 * One stacked bar drawn in its own box (e.g. a table cell), so it aligns with whatever column it sits in.
 * Share a `createStackScale` result between the columns of a chart.
 */
export function ColumnStack({
  segments,
  scale,
  barWidth = 0.76,
  radius = 4,
  highlightedSeries = null,
  overlay = null,
  gridLines = true,
  onSegmentEnter,
  onSegmentLeave,
  className,
}: ColumnStackProps) {
  const clipId = useId();
  const { yScale, ticks, height } = scale;
  const x = `${((1 - barWidth) / 2) * 100}%`;
  const width = `${barWidth * 100}%`;
  const top = yScale(segments.at(-1)?.y1 ?? 0);
  const baseline = yScale(0);
  const overlaySegment = overlay && segments.find((s) => s.series.key === overlay.seriesKey);
  // The part is drawn from the bottom of its segment and never taller than the segment.
  const overlayTop = overlaySegment ? overlaySegment.y0 + Math.min(overlay.value, overlaySegment.value) : 0;

  return (
    <svg
      width="100%"
      height={height}
      aria-hidden="true"
      focusable="false"
      className={clsx('block', className)}
    >
      {gridLines && (
        <g className="stroke-grid" strokeLinecap="round" data-chart-layer="grid">
          {ticks.map((tick) => (
            <line key={tick} x1={0} x2="100%" y1={yScale(tick)} y2={yScale(tick)} strokeDasharray="1 6" />
          ))}
        </g>
      )}
      <clipPath id={clipId}>
        <rect x={x} y={top} width={width} height={baseline - top} rx={radius} />
      </clipPath>
      <g clipPath={`url(#${clipId})`} data-chart-layer="bars">
        {segments.map((segment) =>
          segment.value === 0 ? null : (
            <rect
              key={segment.series.key}
              x={x}
              y={yScale(segment.y1)}
              width={width}
              height={yScale(segment.y0) - yScale(segment.y1)}
              style={{ fill: segment.series.color }}
              className={clsx(
                'transition-opacity motion-reduce:transition-none',
                highlightedSeries !== null && segment.series.key !== highlightedSeries && 'opacity-25',
              )}
              data-series={segment.series.key}
              data-value={segment.value}
              onMouseEnter={onSegmentEnter && (() => onSegmentEnter(segment))}
              onMouseLeave={onSegmentLeave}
            />
          ),
        )}
        {overlaySegment && overlay.value > 0 && (
          <rect
            x={x}
            y={yScale(overlayTop)}
            width={width}
            height={yScale(overlaySegment.y0) - yScale(overlayTop)}
            className="pointer-events-none fill-ink/25 stroke-ink"
            strokeWidth={1.5}
            data-chart-layer="overlay"
          />
        )}
      </g>
    </svg>
  );
}
