import { useQuery } from '@tanstack/react-query';

import { companySchema, type Dataset } from '@nevis/shared';

import { getJson } from '@/shared/api/httpClient';

import { toFacts } from '../model/facts';

const DATASET: Dataset = 'extended';

/** The explorer works on the extended dataset, flattened into facts for pivoting. */
export function useExplorerFacts() {
  return useQuery({
    queryKey: ['clients', DATASET],
    queryFn: ({ signal }) => getJson(`/api/clients?dataset=${DATASET}`, companySchema, { signal }),
    select: toFacts,
  });
}
