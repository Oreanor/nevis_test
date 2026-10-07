import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/httpClient';

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && (!(error instanceof ApiError) || error.isRetryable),
      },
    },
  });
}
