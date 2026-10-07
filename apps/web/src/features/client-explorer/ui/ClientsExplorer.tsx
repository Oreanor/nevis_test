import { useSearchParams } from 'react-router';

import { Card } from '@/shared/ui/Card';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Skeleton } from '@/shared/ui/Skeleton';

import { useExplorerFacts } from '../api/explorerQueries';
import { type ExplorerView, parseView, toSearchParams } from '../model/explorerView';
import { ExplorerGrid } from './ExplorerGrid';

export function ClientsExplorer() {
  const { data: facts, error, isPending, isFetching, refetch } = useExplorerFacts();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams);
  const setView = (next: ExplorerView) => setSearchParams(toSearchParams(next));

  if (isPending) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col gap-4 p-4" aria-busy="true">
        <p role="status" className="sr-only">
          Loading clients…
        </p>
        <Skeleton className="h-60 w-full" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load clients"
        message={error.message}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  // Each breakdown has its own rows, so expansion state starts fresh when it changes.
  return <ExplorerGrid key={view.breakdown} facts={facts} view={view} onViewChange={setView} />;
}
