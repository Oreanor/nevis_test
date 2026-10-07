import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

/** Query client for tests: no retries, so error states render immediately. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** Renders feature UI with the providers it needs, without depending on the app layer. */
export function renderWithProviders(ui: ReactElement, queryClient: QueryClient = createTestQueryClient()) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
