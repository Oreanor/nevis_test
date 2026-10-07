import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/renderWithProviders';

import { companyFixture } from '../testing/companyFixture';
import { ClientsDashboard } from './ClientsDashboard';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const renderDashboard = () => renderWithProviders(<ClientsDashboard />);

describe('ClientsDashboard', () => {
  it('shows a loading state, then the chart and table', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(companyFixture)));
    renderDashboard();

    expect(screen.getByRole('status')).toHaveTextContent('Loading clients…');

    expect(await screen.findByRole('treegrid')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /clients by type per month/i })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/clients', expect.anything());
  });

  it('shows the server error and recovers when retry succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'Database unavailable' } }, 503))
      .mockResolvedValueOnce(jsonResponse(companyFixture));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderDashboard();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load clients");
    expect(alert).toHaveTextContent('Database unavailable');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('treegrid')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('treats a malformed payload as an error instead of rendering broken data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 'x', name: 'Company' })));
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected format');
  });

  describe('axe', () => {
    it('has no violations while loading', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise<Response>(() => undefined)),
      );
      renderDashboard();
      await expectNoAxeViolations(document.body);
    });

    it('has no violations in the error state', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'Down' } }, 503)));
      renderDashboard();
      await screen.findByRole('alert');
      await expectNoAxeViolations(document.body);
    });
  });
});
