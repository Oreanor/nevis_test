import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react';

import { formatInteger } from '@/shared/lib/format';
import { buildMonthColumns } from '@/shared/lib/months';
import { useElementSize } from '@/shared/lib/useElementSize';
import { createStackScale } from '@/shared/ui/chart';
import { TreeTable, type TreeTableColumn } from '@/shared/ui/tree-table';

import type { ExplorerView } from '../model/explorerView';
import type { ClientFact } from '../model/facts';
import { buildPivotTree, findPath, type PivotNode, TOTAL_ID } from '../model/pivot';
import { buildScopeChart, resolveHighlight } from '../model/scopeChart';
import { createSeriesColors } from '../model/seriesColors';
import { BreakdownSelector } from './BreakdownSelector';
import { CHART_Y_AXIS_SPACE, ChartHeaderRow, type ChartHover } from './ChartHeaderRow';
import { ExplorerRowName } from './ExplorerRowName';
import { ScopeBreadcrumb } from './ScopeBreadcrumb';
import { SeriesLegend } from './SeriesLegend';

/** Legend titles: what the colours stand for. */
const SERIES_TITLE: Record<string, string> = {
  branch: 'Branches',
  adviser: 'Advisers',
  clientType: 'Client types',
};

/** Space between the control panel and the y axis of the chart, in px. */
const PANEL_GAP = 24;
/** Height of the month header row from `sm` up (`h-14`). */
const MONTH_ROW_HEIGHT = 56;

const SERIES_NOUN: Record<string, string> = {
  branch: 'branch',
  adviser: 'adviser',
  clientType: 'client type',
};

const getRowId = (node: PivotNode) => node.id;
const getSubRows = (node: PivotNode) => node.children;
const getRowLabel = (node: PivotNode) => node.name;

interface ExplorerGridProps {
  facts: readonly ClientFact[];
  view: ExplorerView;
  onViewChange: (view: ExplorerView) => void;
}

/**
 * Chart and table as one grid: the chart is the table's first header row, so bars sit above their month's
 * figures. Selecting a row re-focuses the chart on it; hovering or focusing a row highlights it in the chart.
 */
export function ExplorerGrid({ facts, view, onViewChange }: ExplorerGridProps) {
  const headingId = useId();
  const months = useMemo(() => buildMonthColumns(), []);
  const colors = useMemo(() => createSeriesColors(facts), [facts]);
  const tree = useMemo(() => buildPivotTree(facts, view.breakdown), [facts, view.breakdown]);

  const foundPath = findPath(tree, view.scopeId);
  const scopePath = foundPath.length ? foundPath : [tree];
  const scope = scopePath.at(-1) ?? tree;
  const chart = useMemo(() => buildScopeChart(scope, colors), [scope, colors]);

  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(scopePath.map((n) => n.id)),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chartHover, setChartHover] = useState<ChartHover | null>(null);
  const [legendHover, setLegendHover] = useState<string | null>(null);
  // Pointing at a series (chart segment, then legend entry) wins over the active table row.
  const hoveredSeries = chartHover?.seriesKey ?? legendHover;
  const highlight = hoveredSeries ? { seriesKey: hoveredSeries } : resolveHighlight(tree, scope.id, activeId);

  const [cornerRef, corner] = useElementSize<HTMLTableCellElement>();
  const scale = useMemo(
    () =>
      corner.height > 0
        ? createStackScale(chart.stacks, { height: corner.height, paddingTop: 12, paddingBottom: 8 })
        : null,
    [chart.stacks, corner.height],
  );

  const seriesColor = useMemo(() => new Map(chart.series.map((s) => [s.key, s.color])), [chart.series]);
  const columns = useMemo(
    (): TreeTableColumn<PivotNode>[] =>
      months.map((month) => ({
        id: month.key,
        header: month.label,
        cell: (node) => formatInteger(node.values[month.index] ?? 0),
      })),
    [months],
  );

  const selectScope = (scopeId: string) => onViewChange({ ...view, scopeId });

  // Picking a series from the legend: select its row, expand it and bring it into view below the header.
  const sectionRef = useRef<HTMLElement>(null);
  const pendingScrollId = useRef<string | null>(null);
  const focusSeries = (id: string) => {
    setExpandedIds((ids) => new Set(ids).add(id));
    selectScope(id);
    pendingScrollId.current = id;
  };
  useEffect(() => {
    const id = pendingScrollId.current;
    if (!id) return;
    pendingScrollId.current = null;
    const rows = sectionRef.current?.querySelectorAll<HTMLElement>('tbody tr[data-row-id]') ?? [];
    const row = [...rows].find((element) => element.dataset.rowId === id);
    const scroller = row?.closest('table')?.parentElement;
    if (!row || !scroller) return;
    if (scroller.scrollHeight > scroller.clientHeight) {
      const headerHeight = scroller.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      const top = row.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top: top - headerHeight, behavior: 'smooth' });
    } else {
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
  const seriesDimension = scope.children[0]?.dimension ?? '';
  const seriesNoun = SERIES_NOUN[seriesDimension] ?? 'series';
  const seriesTitle = SERIES_TITLE[seriesDimension] ?? 'Series';

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className="relative flex min-h-0 flex-1 flex-col rounded-lg bg-surface fit:[container-type:size]"
      style={
        {
          '--controls-width': `${Math.max(0, corner.width - CHART_Y_AXIS_SPACE - PANEL_GAP)}px`,
          // The panel may use the chart row and the (empty) corner of the month row, never the data rows.
          '--controls-max-height': `${corner.height + MONTH_ROW_HEIGHT}px`,
        } as CSSProperties
      }
    >
      <h2 id={headingId} className="sr-only">
        Clients per month, by {SERIES_NOUN[view.breakdown]}
      </h2>

      {/* Controls come before the table in reading and tab order; from `sm` up they sit in its top-left corner. */}
      <div className="flex flex-col gap-4 p-4 sm:absolute sm:top-0 sm:left-0 sm:z-30 sm:max-h-(--controls-max-height) sm:w-(--controls-width) sm:overflow-y-auto sm:p-5 sm:pr-0">
        <ScopeBreadcrumb path={scopePath} onSelect={selectScope} />
        <BreakdownSelector
          value={view.breakdown}
          onChange={(breakdown) => onViewChange({ breakdown, scopeId: TOTAL_ID })}
        />
        <SeriesLegend
          series={chart.series}
          title={seriesTitle}
          seriesNoun={seriesNoun}
          highlightedKey={highlight?.seriesKey}
          onHoverChange={setLegendHover}
          searchable={view.breakdown === 'adviser' && seriesDimension === 'adviser'}
          onPick={focusSeries}
          getDescription={(key) => scope.children.find((child) => child.id === key)?.context}
        />
      </div>
      <p role="status" className="sr-only">
        Chart shows {scope.name} by {seriesNoun}.
      </p>

      <TreeTable
        aria-labelledby={headingId}
        className="min-h-0 flex-1 rounded-lg fit:overflow-auto"
        data={[tree]}
        columns={columns}
        getRowId={getRowId}
        getSubRows={getSubRows}
        getRowLabel={getRowLabel}
        renderRowHeader={(node) => <ExplorerRowName node={node} seriesColor={seriesColor.get(node.id)} />}
        expandedIds={expandedIds}
        onExpandedChange={setExpandedIds}
        selectedId={scope.id}
        onSelect={selectScope}
        onActiveRowChange={setActiveId}
        highlightedRowId={hoveredSeries}
        highlightedColumnId={chartHover ? (months[chartHover.month]?.key ?? null) : null}
        stickyHeader
        headerRows={
          <ChartHeaderRow
            months={months}
            stacks={chart.stacks}
            scale={scale}
            highlight={highlight}
            hover={chartHover}
            onHoverChange={setChartHover}
            cornerRef={cornerRef}
          />
        }
      />
    </section>
  );
}
