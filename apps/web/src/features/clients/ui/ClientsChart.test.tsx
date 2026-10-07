import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildMonthColumns } from '@/shared/lib/months';
import { expectNoAxeViolations } from '@/test/axe';

import { toClientTree } from '../model/clientTree';
import { companyFixture } from '../testing/companyFixture';
import { ClientsChart } from './ClientsChart';
import { compactLayout, compactMonthLabel } from './clientsChartLayout';
import { toClientTypeChartData } from './clientTypeChartData';

const root = toClientTree(companyFixture);
const months = buildMonthColumns();

describe('toClientTypeChartData', () => {
  it('produces one datum per month with a value per client type', () => {
    const { data, series } = toClientTypeChartData(root, months);

    expect(series.map((s) => s.label)).toEqual(['Existing clients', 'New organic', 'New paid']);
    expect(data).toHaveLength(12);
    expect(data[0]).toEqual({
      key: '2024-02',
      label: 'Feb 2024',
      values: { existing: 96, organic: 3, paid: 1 },
    });
    expect(data[11]).toEqual({
      key: '2025-01',
      label: 'Jan 2025',
      values: { existing: 195, organic: 8, paid: 7 },
    });
  });
});

describe('ClientsChart', () => {
  it('draws a stack per month whose segments carry the mapped values', () => {
    const { container } = render(<ClientsChart root={root} months={months} width={1000} />);

    const stacks = container.querySelectorAll('[data-datum]');
    expect(stacks).toHaveLength(12);

    const feb = container.querySelector('[data-datum="2024-02"]');
    const segments = [...(feb?.querySelectorAll<SVGRectElement>('[data-series]') ?? [])];
    expect(segments.map((s) => [s.dataset.series, s.dataset.value])).toEqual([
      ['existing', '96'],
      ['organic', '3'],
      ['paid', '1'],
    ]);
  });

  it('labels months on the x axis and shows the legend', () => {
    const { container } = render(<ClientsChart root={root} months={months} width={1000} />);

    const xLabels = [...container.querySelectorAll('[data-chart-layer="x-axis"] text')].map(
      (t) => t.textContent,
    );
    expect(xLabels).toEqual(months.map((m) => m.label));
    expect(container.querySelector('ul')).toHaveTextContent('Existing clientsNew organicNew paid');
  });

  it('offers the same numbers as an accessible table, with totals matching the company row', () => {
    render(<ClientsChart root={root} months={months} width={1000} />);

    const table = screen.getByRole('table', { name: 'Company clients by type per month' });
    const totalRow = within(table).getByRole('row', { name: /^Total/ });
    const totals = within(totalRow)
      .getAllByRole('cell')
      .map((cell) => Number(cell.textContent));
    expect(totals).toEqual(companyFixture.values);
  });

  it('has no axe violations', async () => {
    render(<ClientsChart root={root} months={months} width={1000} />);
    await expectNoAxeViolations(document.body);
  });

  it('uses compact month labels on small screens so all months fit', () => {
    const { container } = render(
      <ClientsChart root={root} months={months} width={340} layout={compactLayout} />,
    );

    const labels = [...container.querySelectorAll('[data-chart-layer="x-axis"] text')].map((text) =>
      [...text.querySelectorAll('tspan')].map((line) => line.textContent),
    );
    expect(labels[0]).toEqual(['Feb', '2024']);
    expect(labels[1]).toEqual(['Mar', '']);
    expect(labels[11]).toEqual(['Jan', '2025']);
    expect(container.querySelector('svg')).toHaveAttribute('height', String(compactLayout.height));
    expect(container.querySelectorAll('[data-datum]')).toHaveLength(12);
  });
});

describe('compactMonthLabel', () => {
  it('shows the year on the first month and on every January only', () => {
    expect(months.map((month) => compactMonthLabel(month))).toEqual([
      ['Feb', '2024'],
      ...['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => [m, '']),
      ['Jan', '2025'],
    ]);
  });
});
