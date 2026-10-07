import { type CSSProperties, useId, useMemo, useRef, useState } from 'react';

import { formatInteger } from '@/shared/lib/format';
import { buildMonthColumns } from '@/shared/lib/months';
import { useElementSize } from '@/shared/lib/useElementSize';
import { createStackScale, Swatch } from '@/shared/ui/chart';
import { Combobox } from '@/shared/ui/Combobox';
import { TreeTable, type TreeTableColumn } from '@/shared/ui/tree-table';

import { DIMENSION_TEXT, type ExplorerView } from '../model/explorerView';
import type { ClientFact } from '../model/facts';
import { adviserChoices, buildPivotTree, findPath, type PivotNode, TOTAL_ID } from '../model/pivot';
import { buildScopeChart, resolveHighlight } from '../model/scopeChart';
import { createSeriesColors } from '../model/seriesColors';
import { BreakdownSelector } from './BreakdownSelector';
import { CHART_Y_AXIS_SPACE, ChartHeaderRow, type ChartHover } from './ChartHeaderRow';
import { ExplorerRowName } from './ExplorerRowName';
import { ScopeBreadcrumb } from './ScopeBreadcrumb';
import { SeriesLegend } from './SeriesLegend';
import { useScrollToRow } from './useScrollToRow';

/** Space between the control panel and the y axis of the chart, in px. */
const PANEL_GAP = 24;
/** Height of the month header row from `sm` up (`h-14`). */
const MONTH_ROW_HEIGHT = 56;
/** Space above the highest tick (for its label) and below the baseline, in px. */
const CHART_PADDING = { top: 28, bottom: 8 };

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

  // An unknown scope (e.g. a stale link) falls back to the whole tree.
  const scopePath = useMemo(() => {
    const path = findPath(tree, view.scopeId);
    return path.length ? path : [tree];
  }, [tree, view.scopeId]);
  const scope = scopePath.at(-1) ?? tree;
  const chart = useMemo(() => buildScopeChart(scope, colors), [scope, colors]);

  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(scopePath.map((n) => n.id)),
  );
  // The selected row must be visible however the scope changed (row, breadcrumb, or Back in the browser),
  // so its ancestors are expanded whenever the scope changes. Adjusted during render, not in an effect.
  const [revealedScopeId, setRevealedScopeId] = useState(scope.id);
  if (revealedScopeId !== scope.id) {
    setRevealedScopeId(scope.id);
    setExpandedIds((ids) => new Set([...ids, ...scopePath.map((n) => n.id)]));
  }
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chartHover, setChartHover] = useState<ChartHover | null>(null);
  const [legendHover, setLegendHover] = useState<string | null>(null);
  // Pointing at a series (chart segment, then legend entry) wins over the active table row.
  // A previewed adviser only counts when it is a series of the current chart (else nothing would match).
  const previewedSeries = legendHover && chart.series.some((s) => s.key === legendHover) ? legendHover : null;
  const hoveredSeries = chartHover?.seriesKey ?? previewedSeries;
  const rowHighlight = useMemo(() => resolveHighlight(tree, scope.id, activeId), [tree, scope.id, activeId]);
  const highlight = hoveredSeries ? { seriesKey: hoveredSeries } : rowHighlight;

  const [cornerRef, corner] = useElementSize<HTMLTableCellElement>();
  const scale = useMemo(
    () =>
      corner.height > 0
        ? createStackScale(chart.stacks, {
            height: corner.height,
            paddingTop: CHART_PADDING.top,
            paddingBottom: CHART_PADDING.bottom,
          })
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

  // Wherever the chart splits by adviser, a searchable picker replaces the legend (there can be many advisers).
  const advisers = useMemo(() => adviserChoices(scopePath), [scopePath]);
  const adviserOptions = useMemo(
    () =>
      advisers?.advisers.map((node) => ({
        id: node.id,
        label: node.name,
        description: node.context,
        icon: <Swatch color={colors.colorOf(node)} />,
      })),
    [advisers, colors],
  );

  // Picking an adviser: select its row, expand it and bring it into view below the header.
  const sectionRef = useRef<HTMLElement>(null);
  const scrollToRow = useScrollToRow(sectionRef);
  const focusSeries = (id: string) => {
    setExpandedIds((ids) => new Set(ids).add(id));
    selectScope(id);
    scrollToRow(id);
  };
  // A bar segment stands for a row: one with children becomes the scope (as when its row is clicked), a leaf
  // is brought into view.
  const pickSeries = (id: string) => {
    const node = scope.children.find((child) => child.id === id);
    if (node?.children.length) focusSeries(id);
    else if (node) scrollToRow(id);
  };

  // A scope's children all share one dimension; leaves have none (and an empty chart).
  const seriesDimension = scope.children[0]?.dimension;
  const seriesText =
    seriesDimension && seriesDimension !== 'total' ? DIMENSION_TEXT[seriesDimension] : undefined;
  const seriesNoun = seriesText?.noun ?? 'series';

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
        Clients per month, by {DIMENSION_TEXT[view.breakdown].noun}
      </h2>

      {/* Controls come before the table in reading and tab order; from `sm` up they sit in its top-left corner. */}
      <div className="flex flex-col gap-4 p-4 sm:absolute sm:top-0 sm:left-0 sm:z-30 sm:max-h-(--controls-max-height) sm:w-(--controls-width) sm:overflow-y-auto sm:p-5 sm:pr-0">
        <ScopeBreadcrumb path={scopePath} onSelect={selectScope} />
        <BreakdownSelector
          value={view.breakdown}
          onChange={(breakdown) => onViewChange({ breakdown, scopeId: TOTAL_ID })}
        />
        {advisers && adviserOptions && (
          // Pick or switch advisers; doubles as the colour legend while the chart shows advisers.
          <Combobox
            label="Advisers"
            placeholder="Find an adviser…"
            options={adviserOptions}
            value={advisers.selectedId}
            onChange={focusSeries}
            onActiveChange={setLegendHover}
          />
        )}
        {seriesDimension !== 'adviser' && (
          <SeriesLegend
            series={chart.series}
            title={seriesText?.plural ?? 'Series'}
            seriesNoun={seriesNoun}
            highlightedKey={highlight?.seriesKey}
            onHoverChange={setLegendHover}
          />
        )}
      </div>
      <p role="status" className="sr-only">
        Chart shows {scope.name} by {seriesNoun}.
      </p>

      <TreeTable
        aria-labelledby={headingId}
        className="min-h-0 flex-1 rounded-lg fit:scrollbar-below-header fit:[scrollbar-gutter:stable] fit:overflow-auto"
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
            onSeriesClick={pickSeries}
            cornerRef={cornerRef}
          />
        }
      />
    </section>
  );
}
