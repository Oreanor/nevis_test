import type { ClientFact } from './facts';

type Dimension = 'branch' | 'adviser' | 'clientType';

/** How the user chose to break the data down; each one is a hierarchy of dimensions. */
export type Breakdown = Dimension;

const BREAKDOWN_HIERARCHY: Record<Breakdown, readonly Dimension[]> = {
  branch: ['branch', 'adviser', 'clientType'],
  clientType: ['clientType', 'branch', 'adviser'],
  // Going from an adviser back up to branches would only repeat the adviser's own branch.
  adviser: ['adviser', 'clientType'],
};

export interface PivotNode {
  /** Stable path id, e.g. `total/branch:<id>/adviser:<id>`. */
  id: string;
  name: string;
  dimension: Dimension | 'total';
  memberId: string;
  values: readonly number[];
  children: readonly PivotNode[];
  avatarUrl?: string;
  /** Secondary label, e.g. an adviser's branch when the hierarchy does not show it. */
  context?: string;
}

export const TOTAL_ID = 'total';

const sumValues = (facts: readonly ClientFact[]): number[] => {
  const monthCount = facts[0]?.values.length ?? 0;
  return Array.from({ length: monthCount }, (_, month) =>
    facts.reduce((sum, fact) => sum + (fact.values[month] ?? 0), 0),
  );
};

/** Groups facts by a dimension, keeping the order in which members first appear in the data. */
function groupBy(facts: readonly ClientFact[], dimension: Dimension): Map<string, ClientFact[]> {
  const groups = new Map<string, ClientFact[]>();
  for (const fact of facts) {
    const key = fact[dimension].id;
    const group = groups.get(key);
    if (group) group.push(fact);
    else groups.set(key, [fact]);
  }
  return groups;
}

function buildLevel(
  facts: readonly ClientFact[],
  dimensions: readonly Dimension[],
  parentId: string,
  ancestors: readonly Dimension[],
): PivotNode[] {
  const [dimension, ...rest] = dimensions;
  if (!dimension) return [];

  return [...groupBy(facts, dimension)].map(([memberId, group]) => {
    const first = group[0] as ClientFact; // groups are never empty
    const id = `${parentId}/${dimension}:${memberId}`;
    const node: PivotNode = {
      id,
      name: first[dimension].name,
      dimension,
      memberId,
      values: sumValues(group),
      children: buildLevel(group, rest, id, [...ancestors, dimension]),
    };
    if (dimension === 'adviser') {
      if (first.adviser.avatarUrl !== undefined) node.avatarUrl = first.adviser.avatarUrl;
      if (!ancestors.includes('branch')) node.context = first.adviser.branchName;
    }
    return node;
  });
}

/** Builds the table hierarchy for a breakdown; every value is the sum of the facts below it. */
export function buildPivotTree(
  facts: readonly ClientFact[],
  breakdown: Breakdown,
  totalName = 'All clients',
): PivotNode {
  return {
    id: TOTAL_ID,
    name: totalName,
    dimension: 'total',
    memberId: TOTAL_ID,
    values: sumValues(facts),
    children: buildLevel(facts, BREAKDOWN_HIERARCHY[breakdown], TOTAL_ID, []),
  };
}

/** Path from the root to the node with `id` (inclusive), or `[]` when it does not exist. */
export function findPath(root: PivotNode, id: string): PivotNode[] {
  if (root.id === id) return [root];
  for (const child of root.children) {
    const path = findPath(child, id);
    if (path.length) return [root, ...path];
  }
  return [];
}

export interface AdviserChoices {
  advisers: readonly PivotNode[];
  /** The adviser the scope is on, if any. */
  selectedId: string | null;
}

/**
 * Advisers to pick from at a scope: its children when they are advisers, or its siblings when the scope is an
 * adviser itself, so the choice stays available for switching after a pick. `null` elsewhere.
 */
export function adviserChoices(scopePath: readonly PivotNode[]): AdviserChoices | null {
  const scope = scopePath.at(-1);
  const parent = scopePath.at(-2);
  if (scope?.children[0]?.dimension === 'adviser') return { advisers: scope.children, selectedId: null };
  if (scope?.dimension === 'adviser' && parent) return { advisers: parent.children, selectedId: scope.id };
  return null;
}
