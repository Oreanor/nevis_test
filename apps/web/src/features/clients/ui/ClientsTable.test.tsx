import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { computeAccessibleName } from 'dom-accessibility-api';
import { describe, expect, it } from 'vitest';

import { buildMonthColumns } from '@/shared/lib/months';
import { expectNoAxeViolations } from '@/test/axe';

import { toClientTree } from '../model/clientTree';
import { companyFixture } from '../testing/companyFixture';
import { ClientsTable } from './ClientsTable';

const root = toClientTree(companyFixture);
const months = buildMonthColumns();

function renderTable() {
  const user = userEvent.setup();
  render(<ClientsTable root={root} months={months} />);
  return { user, grid: screen.getByRole('treegrid', { name: /clients per month/i }) };
}

const visibleNames = (grid: HTMLElement) =>
  within(grid)
    .getAllByRole('rowheader')
    .map((cell) => computeAccessibleName(cell));

const row = (name: string) => screen.getByRole('row', { name: new RegExp(`^${name}`) });

describe('ClientsTable', () => {
  it('starts with the company expanded, like the design', () => {
    const { grid } = renderTable();
    expect(visibleNames(grid)).toEqual(['Company', 'Branch 1', 'Branch 2']);
  });

  it('renders a column per month with the node values', () => {
    const { grid } = renderTable();

    const headers = within(grid).getAllByRole('columnheader').slice(1);
    expect(headers.map((h) => h.textContent)).toEqual(months.map((m) => m.label));
    const cells = within(row('Branch 1')).getAllByRole('gridcell');
    expect(cells.map((c) => Number(c.textContent))).toEqual(companyFixture.branches?.[0]?.values);
  });

  it('drills down from branch to employees to channels', async () => {
    const { user, grid } = renderTable();

    await user.click(screen.getByRole('button', { name: 'Expand Branch 1' }));
    expect(visibleNames(grid)).toEqual(['Company', 'Branch 1', 'Anna Blackwood', 'James Walker', 'Branch 2']);

    await user.click(screen.getByRole('button', { name: 'Expand Anna Blackwood' }));
    expect(visibleNames(grid)).toEqual([
      'Company',
      'Branch 1',
      'Anna Blackwood',
      'Existing clients',
      'New organic',
      'New paid',
      'James Walker',
      'Branch 2',
    ]);
    expect(row('New paid')).toHaveAttribute('aria-level', '4');
  });

  it('handles the irregular nesting: only rows with children are expandable', () => {
    renderTable();
    expect(row('Branch 1')).toHaveAttribute('aria-expanded', 'false');
    expect(row('Branch 2')).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByRole('button', { name: 'Expand Branch 2' })).not.toBeInTheDocument();
  });

  it('shows avatars for employees only', async () => {
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'Expand Branch 1' }));

    expect(row('Anna Blackwood').querySelector('img')).toHaveAttribute('src', '/avatars/anna.svg');
    expect(row('Branch 1').querySelector('img')).toBeNull();
  });

  it('has no axe violations with every level expanded, avatars included', async () => {
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'Expand Branch 1' }));
    await user.click(screen.getByRole('button', { name: 'Expand Anna Blackwood' }));

    await expectNoAxeViolations(document.body);
  });
});
