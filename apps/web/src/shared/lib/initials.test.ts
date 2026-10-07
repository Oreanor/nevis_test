import { describe, expect, it } from 'vitest';

import { getInitials } from './initials';

describe('getInitials', () => {
  it.each([
    ['Anna Blackwood', 'AB'],
    ['maria del carmen gutierrez', 'MG'],
    ['  Robert   Chen ', 'RC'],
    ['Cher', 'C'],
    ['', ''],
  ])('%j → %j', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});
