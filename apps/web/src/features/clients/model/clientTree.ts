import type { Company } from '@nevis/shared';

type ClientNodeKind = 'company' | 'branch' | 'employee' | 'channel';

/** Uniform tree node; the only place that knows the payload's per-level keys is `toClientTree`. */
export interface ClientNode {
  id: string;
  name: string;
  kind: ClientNodeKind;
  /** Monthly client counts, aligned with the reporting period. */
  values: readonly number[];
  avatarUrl?: string;
  children: readonly ClientNode[];
}

export function toClientTree(company: Company): ClientNode {
  return {
    id: company.id,
    name: company.name,
    kind: 'company',
    values: company.values,
    children: (company.branches ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name,
      kind: 'branch',
      values: branch.values,
      children: (branch.employees ?? []).map((employee) => ({
        id: employee.id,
        name: employee.name,
        kind: 'employee',
        values: employee.values,
        ...(employee.avatarUrl !== undefined && { avatarUrl: employee.avatarUrl }),
        children: (employee.channels ?? []).map((channel) => ({
          id: channel.id,
          name: channel.name,
          kind: 'channel',
          values: channel.values,
          children: [],
        })),
      })),
    })),
  };
}

/** Depth-first list of every node matching `predicate`. */
export function findNodes(root: ClientNode, predicate: (node: ClientNode) => boolean): ClientNode[] {
  const matches: ClientNode[] = [];
  const visit = (node: ClientNode) => {
    if (predicate(node)) matches.push(node);
    node.children.forEach(visit);
  };
  visit(root);
  return matches;
}
