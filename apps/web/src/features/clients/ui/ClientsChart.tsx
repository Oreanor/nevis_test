import { useId, useMemo } from 'react';

import { mediaQueries } from '@/shared/config/breakpoints';
import { formatInteger } from '@/shared/lib/format';
import type { MonthColumn } from '@/shared/lib/months';
import { useMediaQuery } from '@/shared/lib/useMediaQuery';
import { Card } from '@/shared/ui/Card';
import {
  ChartCanvas,
  ChartDataTable,
  ChartLegend,
  ChartRoot,
  GridLines,
  StackedBars,
  XAxis,
  YAxis,
} from '@/shared/ui/chart';

import type { ClientNode } from '../model/clientTree';
import { type ClientsChartLayout, compactLayout, regularLayout } from './clientsChartLayout';
import { toClientTypeChartData } from './clientTypeChartData';

interface ClientsChartProps {
  root: ClientNode;
  months: readonly MonthColumn[];
  /** Fixed width in px; the chart fills its container when omitted. */
  width?: number;
  /** Forces a layout; by default it follows the viewport (compact below the `sm` breakpoint). */
  layout?: ClientsChartLayout;
}

export function ClientsChart({ root, months, width, layout: layoutOverride }: ClientsChartProps) {
  const headingId = useId();
  const isWide = useMediaQuery(mediaQueries.sm);
  const layout = layoutOverride ?? (isWide ? regularLayout : compactLayout);
  const { data, series } = useMemo(() => toClientTypeChartData(root, months), [root, months]);
  const title = `${root.name} clients by type per month`;

  return (
    <Card aria-labelledby={headingId} className="px-2 pt-3 pb-2 sm:px-4 sm:pt-6 sm:pb-4">
      <h2 id={headingId} className="sr-only">
        {title}
      </h2>
      <ChartRoot
        data={data}
        series={series}
        height={layout.height}
        minWidth={layout.minWidth}
        margin={layout.margin}
        bandPadding={layout.bandPadding}
        width={width}
      >
        <ChartCanvas>
          <GridLines />
          <YAxis
            tickFormat={formatInteger}
            offset={layout.yAxisOffset}
            baselineOffset={layout.yLabelBaselineOffset}
            className={layout.axisClassName}
          />
          <XAxis
            offset={layout.xAxisOffset}
            className={layout.axisClassName}
            tickFormat={(_, index) => {
              const month = months[index];
              return month ? layout.monthLabel(month) : '';
            }}
          />
          <StackedBars radius={4} />
        </ChartCanvas>
        <ChartLegend className="mt-1 sm:mt-2" />
        <ChartDataTable caption={title} valueFormat={formatInteger} />
      </ChartRoot>
    </Card>
  );
}
