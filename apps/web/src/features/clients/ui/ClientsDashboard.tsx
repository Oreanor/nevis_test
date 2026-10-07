import { useMemo } from 'react';

import { buildMonthColumns } from '@/shared/lib/months';
import { ErrorBoundary, type ErrorBoundaryFallbackProps } from '@/shared/ui/ErrorBoundary';
import { ErrorState } from '@/shared/ui/ErrorState';

import { useClientTree } from '../api/clientsQueries';
import { ClientsChart } from './ClientsChart';
import { ClientsDashboardSkeleton } from './ClientsDashboardSkeleton';
import { ClientsTable } from './ClientsTable';

const widgetErrorFallback =
  (title: string) =>
  ({ reset }: ErrorBoundaryFallbackProps) => (
    <ErrorState title={title} message="This section failed to render." onRetry={reset} />
  );

export function ClientsDashboard() {
  const { data: root, error, isPending, isFetching, refetch } = useClientTree();
  const months = useMemo(() => buildMonthColumns(), []);

  if (isPending) return <ClientsDashboardSkeleton />;

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

  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      <ErrorBoundary fallback={widgetErrorFallback('Chart unavailable')}>
        <ClientsChart root={root} months={months} />
      </ErrorBoundary>
      <ErrorBoundary fallback={widgetErrorFallback('Table unavailable')}>
        <ClientsTable root={root} months={months} />
      </ErrorBoundary>
    </div>
  );
}
