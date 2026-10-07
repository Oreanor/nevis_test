import type { Company } from '@nevis/shared';

/**
 * Small payload covering every shape the pivot must handle. Two months only, so sums are easy to check by eye:
 * - Branch A: two advisers with a full client-type split (one with an avatar);
 * - Branch B: one adviser without a client-type split;
 * - Branch C: no advisers at all.
 */
export const explorerFixture: Company = {
  id: 'company',
  name: 'Company',
  values: [100, 110],
  branches: [
    {
      id: 'a',
      name: 'Branch A',
      values: [60, 66],
      employees: [
        {
          id: 'anna',
          name: 'Anna',
          avatarUrl: '/avatars/anna.png',
          values: [40, 44],
          channels: [
            { id: 'anna-e', name: 'Existing clients', values: [30, 32] },
            { id: 'anna-o', name: 'New organic', values: [6, 7] },
            { id: 'anna-p', name: 'New paid', values: [4, 5] },
          ],
        },
        {
          id: 'james',
          name: 'James',
          values: [20, 22],
          channels: [
            { id: 'james-e', name: 'Existing clients', values: [16, 17] },
            { id: 'james-o', name: 'New organic', values: [2, 3] },
            { id: 'james-p', name: 'New paid', values: [2, 2] },
          ],
        },
      ],
    },
    {
      id: 'b',
      name: 'Branch B',
      values: [30, 32],
      employees: [{ id: 'olivia', name: 'Olivia', values: [30, 32] }],
    },
    { id: 'c', name: 'Branch C', values: [10, 12] },
  ],
};

/** The fixture as the API would serve it: 12 months (the schema requires them), padded with zeros. */
export function explorerPayload(): Company {
  const pad = (values: readonly number[]) => [...values, ...Array<number>(12 - values.length).fill(0)];
  return {
    ...explorerFixture,
    values: pad(explorerFixture.values),
    branches: explorerFixture.branches?.map((branch) => ({
      ...branch,
      values: pad(branch.values),
      employees: branch.employees?.map((employee) => ({
        ...employee,
        values: pad(employee.values),
        channels: employee.channels?.map((channel) => ({ ...channel, values: pad(channel.values) })),
      })),
    })),
  };
}
