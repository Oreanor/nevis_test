import { isRouteErrorResponse, useRouteError } from 'react-router';

import { ErrorState } from '@/shared/ui/ErrorState';

/** Last-resort boundary for render errors and failed lazy route chunks. */
export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong while rendering this page.';

  return (
    <main className="mx-auto w-full max-w-[1440px] p-4">
      <ErrorState
        title="Unexpected error"
        message={message}
        onRetry={() => window.location.reload()}
        retryLabel="Reload page"
      />
    </main>
  );
}
