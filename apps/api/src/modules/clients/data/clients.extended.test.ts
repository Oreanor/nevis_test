import { describe, expect, it } from 'vitest';

import { type Company, companySchema } from '@nevis/shared';

import extended from './clients.extended.json' with { type: 'json' };
import brief from './clients.json' with { type: 'json' };

const data = companySchema.parse(extended);
const briefData = companySchema.parse(brief);

type Node = Pick<Company, 'name' | 'values'>;

const sumValues = (nodes: readonly Node[]) =>
  data.values.map((_, month) => nodes.reduce((sum, node) => sum + (node.values[month] ?? 0), 0));

describe('extended dataset', () => {
  const branches = data.branches ?? [];
  const advisers = branches.flatMap((branch) => branch.employees ?? []);

  it('has advisers in every branch and a client-type split for every adviser', () => {
    expect(branches.every((branch) => (branch.employees?.length ?? 0) > 0)).toBe(true);
    expect(
      advisers.every(
        (adviser) => adviser.channels?.map((c) => c.name).join() === 'Existing clients,New organic,New paid',
      ),
    ).toBe(true);
  });

  it('is consistent: every parent equals the sum of its children', () => {
    expect(data.values).toEqual(sumValues(branches));
    for (const branch of branches)
      expect(branch.values, branch.name).toEqual(sumValues(branch.employees ?? []));
    for (const adviser of advisers)
      expect(adviser.values, adviser.name).toEqual(sumValues(adviser.channels ?? []));
  });

  it('has no negative figures', () => {
    const all = advisers.flatMap((adviser) => (adviser.channels ?? []).flatMap((channel) => channel.values));
    expect(Math.min(...all)).toBeGreaterThanOrEqual(0);
  });

  it("keeps the brief's ids, advisers and their monthly totals, and the totals of branches 2 and 3", () => {
    const briefBranches = briefData.branches ?? [];
    expect(branches.map((b) => b.id)).toEqual(briefBranches.map((b) => b.id));
    expect(branches[0]?.employees?.map(({ id, name, values }) => ({ id, name, values }))).toEqual(
      briefBranches[0]?.employees?.map(({ id, name, values }) => ({ id, name, values })),
    );
    expect(branches[1]?.values).toEqual(briefBranches[1]?.values);
    expect(branches[2]?.values).toEqual(briefBranches[2]?.values);
  });

  it('uses unique ids', () => {
    const ids = [
      data.id,
      ...branches.map((b) => b.id),
      ...advisers.flatMap((a) => [a.id, ...(a.channels ?? []).map((c) => c.id)]),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
