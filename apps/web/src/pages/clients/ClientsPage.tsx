import { Link } from 'react-router';

import { ClientsDashboard } from '@/features/clients';

export function ClientsPage() {
  return (
    <>
      <title>Clients · Nevis</title>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-2xl font-normal sm:text-title">Clients</h1>
        <Link
          to="/explorer"
          className="text-body text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Open the clients explorer
        </Link>
      </header>
      <ClientsDashboard />
    </>
  );
}
