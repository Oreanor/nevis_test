import { createBrowserRouter, type RouteObject } from 'react-router';

import { RootLayout } from './RootLayout';
import { RouteErrorPage } from './RouteErrorPage';
import type { RouteHandle } from './routeHandle';

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/pages/clients/ClientsPage')).ClientsPage }),
      },
      {
        path: 'explorer',
        handle: { fullHeight: true } satisfies RouteHandle,
        lazy: async () => ({ Component: (await import('@/pages/explorer/ExplorerPage')).ExplorerPage }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/not-found/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
