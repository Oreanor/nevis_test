import { type ChartSeries, stackData, type StackedSegment } from '@/shared/ui/chart';

import { findPath, type PivotNode } from './pivot';
import type { SeriesColors } from './seriesColors';

export interface ScopeChart {
  /** The selected row's children, in table order (bottom of the stack first). */
  series: readonly ChartSeries[];
  /** One stack per month. */
  stacks: readonly (readonly StackedSegment[])[];
}

/** The chart for a scope: the scope row split by its children, one stacked bar per month. */
export function buildScopeChart(scope: PivotNode, colors: SeriesColors): ScopeChart {
  const series = scope.children.map((child) => ({
    key: child.id,
    label: child.name,
    color: colors.colorOf(child),
  }));
  const data = scope.values.map((_, month) => ({
    key: String(month),
    label: String(month),
    values: Object.fromEntries(scope.children.map((child) => [child.id, child.values[month] ?? 0])),
  }));
  return { series, stacks: stackData(data, series) };
}

export interface ChartHighlight {
  /** Series to emphasise; the others are dimmed. */
  seriesKey: string;
  /** Monthly values of a deeper row inside that series, drawn as a marked part of its segment. */
  partValues?: readonly number[];
}

/**
 * How the chart reflects the active (hovered or focused) table row:
 * - a series of the chart is emphasised;
 * - a row deeper inside a series emphasises that series and marks the row's part of it;
 * - rows outside the scope, or the scope itself, change nothing.
 */
export function resolveHighlight(
  root: PivotNode,
  scopeId: string,
  activeId: string | null,
): ChartHighlight | null {
  if (activeId === null) return null;
  const path = findPath(root, activeId);
  const scopeDepth = path.findIndex((node) => node.id === scopeId);
  const series = scopeDepth === -1 ? undefined : path[scopeDepth + 1];
  if (!series) return null;

  const active = path.at(-1);
  return active && active.id !== series.id
    ? { seriesKey: series.id, partValues: active.values }
    : { seriesKey: series.id };
}
