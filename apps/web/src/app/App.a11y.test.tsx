import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { companyFixture } from '@/features/clients/testing/companyFixture';
import { expectNoAxeViolations } from '@/test/axe';
import { createTestQueryClient } from '@/test/renderWithProviders';

import { AppProviders } from './AppProviders';
import { routes } from './router';

function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <AppProviders queryClient={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

// Whole pages include landmarks and heading structure, so the `region` rule is checked here.
// axe on a whole page is slow in jsdom; under a full parallel run it needs more than the 5s default.
const PAGE_SCAN_TIMEOUT = 20_000;
const pageRules = { rules: { region: { enabled: true } } };

describe('page accessibility', () => {
  it(
    'Clients page has no axe violations once loaded',
    async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(companyFixture), { status: 200 })),
      );
      renderRoute('/');

      // The page is a lazy route: under a full parallel run it can take longer than findBy's 1s default.
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Clients' }, { timeout: 5000 }),
      ).toBeInTheDocument();
      await screen.findByRole('treegrid');
      await expectNoAxeViolations(document.body, pageRules);
    },
    PAGE_SCAN_TIMEOUT,
  );

  it(
    'Not found page has no axe violations',
    async () => {
      renderRoute('/does-not-exist');

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Page not found' }, { timeout: 5000 }),
      ).toBeInTheDocument();
      await expectNoAxeViolations(document.body, pageRules);
    },
    PAGE_SCAN_TIMEOUT,
  );
});
