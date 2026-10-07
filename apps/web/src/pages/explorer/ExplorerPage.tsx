import { Link } from 'react-router';

import { ClientsExplorer } from '@/features/client-explorer';

export function ExplorerPage() {
  return (
    <>
      <title>Clients explorer · Nevis</title>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-2xl font-normal sm:text-title">Clients explorer</h1>
        <Link to="/" className="text-body text-muted underline-offset-2 hover:text-ink hover:underline">
          Back to the dashboard
        </Link>
      </header>
      <ClientsExplorer />
    </>
  );
}
