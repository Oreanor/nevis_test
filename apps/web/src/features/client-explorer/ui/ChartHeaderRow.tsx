import type { Ref } from 'react';

import type { MonthColumn } from '@/shared/lib/months';
import { ColumnStack, ColumnYAxis, type StackedSegment, type StackScale } from '@/shared/ui/chart';

import type { ChartHighlight } from '../model/scopeChart';
import { ColumnTooltip } from './ColumnTooltip';

/**
 * Chart height in the one-screen mode (`fit`): chart and month row take half of the explorer card (a size
 * container, `cqh`), so the table keeps the other half; 128–420px. Otherwise the page scrolls and the chart
 * keeps a fixed 240px. See docs/IMPROVEMENTS.md.
 */
const CHART_HEIGHT_CLASS = 'h-60 fit:h-[clamp(8rem,calc(50cqh-3.5rem),26.25rem)]';
const Y_AXIS_WIDTH = 28;
/** Columns from here on open their tooltip towards the left, so it stays inside the table. */
const TOOLTIP_FLIP_INDEX = 8;

/** Month under the pointer, and the segment under it if any. */
export interface ChartHover {
  month: number;
  seriesKey: string | null;
}

interface ChartHeaderRowProps {
  months: readonly MonthColumn[];
  stacks: readonly (readonly StackedSegment[])[];
  /** `null` until the row has been measured. */
  scale: StackScale | null;
  highlight: ChartHighlight | null;
  hover: ChartHover | null;
  onHoverChange: (hover: ChartHover | null) => void;
  /** Measures the corner cell: its height is the chart height, its width the hierarchy column's. */
  cornerRef: Ref<HTMLTableCellElement>;
}

/**
 * The chart as the first header row of the table: one stacked bar per month cell, so bars align with their
 * month's figures and scroll and shrink with them. Hidden from assistive technology – the table carries the data.
 */
export function ChartHeaderRow({
  months,
  stacks,
  scale,
  highlight,
  hover,
  onHoverChange,
  cornerRef,
}: ChartHeaderRowProps) {
  return (
    <tr aria-hidden="true">
      <td
        ref={cornerRef}
        className={`sticky left-0 z-10 bg-surface p-0 align-top sm:min-w-80 ${CHART_HEIGHT_CLASS}`}
      >
        {scale && (
          <div className="flex justify-end pr-2">
            <ColumnYAxis scale={scale} width={Y_AXIS_WIDTH} baselineOffset={2} />
          </div>
        )}
      </td>
      {months.map((month) => {
        const segments = stacks[month.index] ?? [];
        const partValue = highlight?.partValues?.[month.index];
        const isHovered = hover?.month === month.index;
        return (
          // The whole column is the hover target: segments can be a pixel or two tall.
          <td
            key={month.key}
            data-month={month.key}
            className={`relative cursor-default bg-surface px-2 py-0 align-top sm:pr-6 sm:pl-0 ${CHART_HEIGHT_CLASS}`}
            onMouseEnter={() => onHoverChange({ month: month.index, seriesKey: null })}
            onMouseLeave={() => onHoverChange(null)}
          >
            {scale && (
              <ColumnStack
                segments={segments}
                scale={scale}
                barWidth={1}
                highlightedSeries={highlight?.seriesKey ?? null}
                overlay={
                  highlight && partValue !== undefined
                    ? { seriesKey: highlight.seriesKey, value: partValue }
                    : null
                }
                onSegmentEnter={(segment) =>
                  onHoverChange({ month: month.index, seriesKey: segment.series.key })
                }
                onSegmentLeave={() => onHoverChange({ month: month.index, seriesKey: null })}
              />
            )}
            {isHovered && segments.length > 0 && (
              <ColumnTooltip
                title={month.label}
                segments={segments}
                hoveredSeriesKey={hover.seriesKey}
                align={month.index < TOOLTIP_FLIP_INDEX ? 'start' : 'end'}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}

export const CHART_Y_AXIS_SPACE = Y_AXIS_WIDTH + 8;
