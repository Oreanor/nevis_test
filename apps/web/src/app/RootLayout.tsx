import { clsx } from 'clsx';
import { Outlet, useMatches } from 'react-router';

import { isRouteHandle } from './routeHandle';

export function RootLayout() {
  const fullHeight = useMatches().some((match) => isRouteHandle(match.handle) && match.handle.fullHeight);

  return (
    <main
      className={clsx(
        'mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col gap-2 p-2 sm:gap-4 sm:px-4 sm:py-6',
        fullHeight && 'fit:h-dvh',
      )}
    >
      <Outlet />
    </main>
  );
}
