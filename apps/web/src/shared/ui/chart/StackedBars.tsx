import { Fragment, type ReactNode, type SVGProps, useId } from 'react';

import { useChart } from './ChartContext';
import type { SegmentGeometry, StackedSegment } from './types';

interface StackedBarsProps {
  /** Corner radius of each whole stack (all four corners), applied by clipping like the design tool does. */
  radius?: number;
  /** Extra props per segment – e.g. event handlers or a highlighted fill. */
  getSegmentProps?: (segment: StackedSegment) => SVGProps<SVGRectElement>;
  /** Replaces the default `<rect>` entirely for full control over segment rendering. */
  renderSegment?: (segment: StackedSegment, geometry: SegmentGeometry) => ReactNode;
  className?: string;
}

export function StackedBars({ radius = 0, getSegmentProps, renderSegment, className }: StackedBarsProps) {
  const { stacks, xScale, yScale } = useChart();
  const clipIdPrefix = useId();

  return (
    <g className={className} data-chart-layer="bars">
      {stacks.map((segments, index) => {
        const datumKey = segments[0]?.datum.key ?? String(index);
        const x = xScale(datumKey);
        const top = yScale(segments.at(-1)?.y1 ?? 0);
        const clipId = `${clipIdPrefix}-${index}`;

        return (
          <g key={datumKey} data-datum={datumKey} clipPath={radius > 0 ? `url(#${clipId})` : undefined}>
            {radius > 0 && (
              <clipPath id={clipId}>
                <rect x={x} y={top} width={xScale.bandwidth} height={yScale(0) - top} rx={radius} />
              </clipPath>
            )}
            {segments.map((segment) => {
              if (segment.value === 0) return null;
              const geometry: SegmentGeometry = {
                x,
                y: yScale(segment.y1),
                width: xScale.bandwidth,
                height: yScale(segment.y0) - yScale(segment.y1),
              };
              if (renderSegment) {
                return <Fragment key={segment.series.key}>{renderSegment(segment, geometry)}</Fragment>;
              }
              return (
                <rect
                  key={segment.series.key}
                  {...geometry}
                  style={{ fill: segment.series.color }}
                  data-series={segment.series.key}
                  data-value={segment.value}
                  {...getSegmentProps?.(segment)}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
