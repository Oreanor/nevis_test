import { describe, expect, it } from 'vitest';

import { explorerFixture } from '../testing/explorerFixture';
import { toFacts } from './facts';

describe('toFacts', () => {
  const facts = toFacts(explorerFixture);
  const describeFact = (f: (typeof facts)[number]) => `${f.branch.name}/${f.adviser.name}/${f.clientType.id}`;

  it('creates one fact per adviser and client type', () => {
    expect(facts.map(describeFact)).toEqual([
      'Branch A/Anna/existing',
      'Branch A/Anna/organic',
      'Branch A/Anna/paid',
      'Branch A/James/existing',
      'Branch A/James/organic',
      'Branch A/James/paid',
      'Branch B/Olivia/unspecified',
      'Branch C/Unassigned/unspecified',
    ]);
  });

  it('keeps totals of advisers without a split and of branches without advisers', () => {
    expect(facts.find((f) => f.adviser.name === 'Olivia')?.values).toEqual([30, 32]);
    expect(facts.find((f) => f.branch.name === 'Branch C')).toMatchObject({
      adviser: { id: 'c:unassigned', name: 'Unassigned' },
      clientType: { name: 'Not specified' },
      values: [10, 12],
    });
  });

  it('carries adviser context: branch name and avatar', () => {
    const anna = facts[0]?.adviser;
    expect(anna).toEqual({
      id: 'anna',
      name: 'Anna',
      branchName: 'Branch A',
      avatarUrl: '/avatars/anna.png',
    });
    expect(facts[3]?.adviser).not.toHaveProperty('avatarUrl');
  });
});
