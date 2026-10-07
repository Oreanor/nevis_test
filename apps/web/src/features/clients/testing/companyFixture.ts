import type { Company } from '@nevis/shared';

const months = (...values: number[]) => values;

/**
 * Payload-shaped fixture with the same irregular nesting as the real data:
 * a branch with employees (only one of them with channels) and a branch without employees.
 */
export const companyFixture: Company = {
  id: 'company',
  name: 'Company',
  values: months(100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210),
  branches: [
    {
      id: 'branch-1',
      name: 'Branch 1',
      values: months(60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120, 126),
      employees: [
        {
          id: 'anna',
          name: 'Anna Blackwood',
          avatarUrl: '/avatars/anna.svg',
          values: months(30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63),
          channels: [
            {
              id: 'anna-existing',
              name: 'Existing clients',
              values: months(26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48),
            },
            { id: 'anna-organic', name: 'New organic', values: months(3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8) },
            { id: 'anna-paid', name: 'New paid', values: months(1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7) },
          ],
        },
        {
          id: 'james',
          name: 'James Walker',
          values: months(30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63),
        },
      ],
    },
    {
      id: 'branch-2',
      name: 'Branch 2',
      values: months(40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84),
    },
  ],
};
