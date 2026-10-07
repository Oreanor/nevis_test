import { describe, expect, it } from 'vitest';

import { buildMonthColumns } from './months';

describe('buildMonthColumns', () => {
  it('defaults to the brief period Feb 2024 – Jan 2025', () => {
    const months = buildMonthColumns();

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({
      key: '2024-02',
      label: 'Feb 2024',
      shortLabel: 'Feb',
      year: 2024,
      month: 2,
      index: 0,
    });
    expect(months.at(-1)).toEqual({
      key: '2025-01',
      label: 'Jan 2025',
      shortLabel: 'Jan',
      year: 2025,
      month: 1,
      index: 11,
    });
  });

  it('rolls over year boundaries', () => {
    expect(buildMonthColumns({ year: 2024, month: 11 }, 3).map((m) => m.label)).toEqual([
      'Nov 2024',
      'Dec 2024',
      'Jan 2025',
    ]);
  });
});
