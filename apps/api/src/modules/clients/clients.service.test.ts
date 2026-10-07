import { describe, expect, it } from 'vitest';

import type { Company } from '@nevis/shared';

import { createClientsService } from './clients.service';

const values = Array.from({ length: 12 }, () => 1);

const company: Company = {
  id: 'c',
  name: 'Company',
  values,
  branches: [
    {
      id: 'b1',
      name: 'Branch 1',
      values,
      employees: [
        { id: 'anna', name: 'Anna', values },
        { id: 'james', name: 'James', values },
      ],
    },
    { id: 'b2', name: 'Branch 2', values },
  ],
};

const service = createClientsService({
  repository: { getCompany: () => Promise.resolve(company) },
  avatars: { urlFor: (id) => (id === 'anna' ? '/avatars/anna.svg' : undefined) },
});

describe('ClientsService', () => {
  it('adds avatar URLs to employees that have an image', async () => {
    const result = await service.getCompany('brief');
    const [anna, james] = result.branches?.[0]?.employees ?? [];

    expect(anna?.avatarUrl).toBe('/avatars/anna.svg');
    expect(james).not.toHaveProperty('avatarUrl');
  });

  it('does not add keys that are absent in the source data', async () => {
    const result = await service.getCompany('brief');
    expect(result.branches?.[1]).not.toHaveProperty('employees');
  });

  it('does not mutate the repository data', async () => {
    await service.getCompany('brief');
    expect(company.branches?.[0]?.employees?.[0]).not.toHaveProperty('avatarUrl');
  });
});
