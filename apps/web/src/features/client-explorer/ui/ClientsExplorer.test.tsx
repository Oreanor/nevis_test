import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '@/test/axe';
import { createTestQueryClient } from '@/test/renderWithProviders';

import { explorerPayload } from '../testing/explorerFixture';
import { ClientsExplorer } from './ClientsExplorer';

const CHART_HEIGHT = 300;

function renderExplorer(initialUrl = '/explorer') {
  const router = createMemoryRouter([{ path: '/explorer', element: <ClientsExplorer /> }], {
    initialEntries: [initialUrl],
  });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { user, router };
}

const row = (name: string) => screen.getByRole('row', { name: new RegExp(`^${name}\\b`) });
const legendLabels = () =>
  within(screen.getByRole('list', { name: /^(Branches|Advisers|Client types)$/ }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
const chartSegments = (container: ParentNode = document) => [
  ...container.querySelectorAll<SVGRectElement>('[data-chart-layer="bars"] rect[data-series]'),
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(explorerPayload()), { status: 200 })),
  );
  // jsdom has no layout: give the chart cells a real height so the bars are drawn.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ width: 320, height: CHART_HEIGHT }),
  );
});

describe('ClientsExplorer', () => {
  it('loads the extended dataset and charts the total by branch', async () => {
    renderExplorer();

    expect(await screen.findByRole('treegrid')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/clients?dataset=extended', expect.anything());
    expect(row('All clients')).toHaveAttribute('aria-selected', 'true');
    expect(legendLabels()).toEqual(['Branch A', 'Branch B', 'Branch C']);
    expect(screen.getByRole('combobox', { name: 'Break down by' })).toHaveValue('branch');
    expect(screen.getByRole('list', { name: 'Branches' })).toBeInTheDocument();
  });

  it('draws one stack per month aligned with the month columns', async () => {
    renderExplorer();
    await screen.findByRole('treegrid');

    const chartRow = document.querySelector('thead tr[aria-hidden="true"]');
    const monthCells = chartRow?.querySelectorAll('td') ?? [];
    expect(monthCells).toHaveLength(13); // corner (y axis) + 12 months
    expect(chartSegments(monthCells[1] as Element).map((s) => s.dataset.value)).toEqual(['60', '30', '10']);
  });

  it('re-focuses the chart on a selected row and offers the way back', async () => {
    const { user, router } = renderExplorer();
    await screen.findByRole('treegrid');

    await user.click(within(row('Branch A')).getAllByRole('gridcell')[0] as HTMLElement);

    expect(router.state.location.search).toBe('?scope=total%2Fbranch%3Aa');
    expect(row('Branch A')).toHaveAttribute('aria-selected', 'true');
    expect(legendLabels()).toEqual(['Anna', 'James']);
    expect(screen.getByRole('list', { name: 'Advisers' })).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent(
      'Chart shows Branch A by adviser.',
    );

    const breadcrumb = screen.getByRole('navigation', { name: 'Chart scope' });
    await user.click(within(breadcrumb).getByRole('button', { name: 'All clients' }));
    expect(legendLabels()).toEqual(['Branch A', 'Branch B', 'Branch C']);
  });

  it('pivots the table when the breakdown changes', async () => {
    const { user, router } = renderExplorer('/explorer?scope=total%2Fbranch%3Aa');
    await screen.findByRole('treegrid');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Break down by' }), 'Client type');

    expect(router.state.location.search).toBe('?by=clientType');
    expect(row('Existing clients')).toHaveAttribute('aria-level', '2');
    expect(legendLabels()).toEqual(['Existing clients', 'New organic', 'New paid', 'Not specified']);
  });

  it('highlights the hovered row in the chart and marks a deeper row inside its series', async () => {
    const { user } = renderExplorer('/explorer?scope=total%2Fbranch%3Aa');
    await screen.findByRole('treegrid');

    await user.hover(row('James'));
    const [, janStack] = document.querySelectorAll('thead tr[aria-hidden="true"] td');
    const dimmed = chartSegments(janStack).filter((s) => s.classList.contains('opacity-25'));
    expect(dimmed.map((s) => s.dataset.series)).toEqual(['total/branch:a/adviser:anna']);

    await user.click(screen.getByRole('button', { name: 'Expand James' }));
    await user.hover(row('New paid'));
    expect(janStack?.querySelector('[data-chart-layer="overlay"]')).toBeInTheDocument();
  });

  it('shows the month in a tooltip and links the hovered segment to its row and month', async () => {
    const { user } = renderExplorer();
    await screen.findByRole('treegrid');
    const febCell = document.querySelector<HTMLElement>('thead td[data-month="2024-02"]');
    if (!febCell) throw new Error('missing chart cell');

    await user.hover(febCell);
    expect(febCell).toHaveTextContent('Feb 2024');
    expect(febCell).toHaveTextContent('Total100');
    expect(screen.getByRole('columnheader', { name: 'Feb 2024' })).toHaveClass('text-ink');

    const branchA = chartSegments(febCell).find((s) => s.dataset.series === 'total/branch:a');
    await user.hover(branchA as Element);
    expect(within(row('Branch A')).getAllByRole('gridcell')[1]).toHaveClass('bg-row-hover');
    expect(chartSegments(febCell).filter((s) => s.classList.contains('opacity-25'))).toHaveLength(2);

    await user.unhover(febCell);
    expect(febCell).not.toHaveTextContent('Total');
  });

  it('highlights a series from its legend entry in the chart and the table', async () => {
    const { user } = renderExplorer();
    await screen.findByRole('treegrid');
    const legend = screen.getByRole('list', { name: 'Branches' });

    await user.hover(within(legend).getByText('Branch B'));

    const dimmed = chartSegments().filter((s) => s.classList.contains('opacity-25'));
    expect(new Set(dimmed.map((s) => s.dataset.series))).toEqual(
      new Set(['total/branch:a', 'total/branch:c']),
    );
    expect(within(row('Branch B')).getAllByRole('gridcell')[0]).toHaveClass('bg-row-hover');

    await user.unhover(legend);
    expect(chartSegments().some((s) => s.classList.contains('opacity-25'))).toBe(false);
  });

  it('offers a persistent adviser search in the adviser breakdown', async () => {
    const { user, router } = renderExplorer('/explorer?by=adviser');
    await screen.findByRole('treegrid');

    const search = screen.getByRole('combobox', { name: 'Advisers' });
    await user.type(search, 'jam');
    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['James, Branch A']);

    await user.keyboard('{ArrowDown}');
    expect(chartSegments().some((s) => s.classList.contains('opacity-25'))).toBe(true);

    await user.keyboard('{Enter}');
    expect(router.state.location.search).toBe('?by=adviser&scope=total%2Fadviser%3Ajames');
    expect(row('James')).toHaveAttribute('aria-selected', 'true');
    expect(legendLabels()).toEqual(['Existing clients', 'New organic', 'New paid']);
    // The adviser search stays, showing the chosen adviser, so another one can be picked straight away.
    expect(screen.getByRole('combobox', { name: 'Advisers' })).toHaveValue('James');
  });

  it('keeps the plain legend when advisers are split under a branch', async () => {
    renderExplorer('/explorer?scope=total%2Fbranch%3Aa');
    await screen.findByRole('treegrid');

    expect(screen.queryByRole('combobox', { name: 'Advisers' })).not.toBeInTheDocument();
    expect(legendLabels()).toEqual(['Anna', 'James']);
  });

  it('has no axe violations', async () => {
    renderExplorer();
    await screen.findByRole('treegrid');
    await expectNoAxeViolations(document.body);
  }, 20_000); // axe over the whole grid is slow in jsdom under a parallel run
});
