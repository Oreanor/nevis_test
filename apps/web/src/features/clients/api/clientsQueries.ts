import { queryOptions, useQuery } from '@tanstack/react-query';

import { toClientTree } from '../model/clientTree';
import { fetchCompany } from './clientsApi';

const clientsKeys = {
  all: ['clients'] as const,
  tree: () => [...clientsKeys.all, 'tree'] as const,
};

const clientTreeQueryOptions = () =>
  queryOptions({
    queryKey: clientsKeys.tree(),
    queryFn: ({ signal }) => fetchCompany(signal),
    select: toClientTree,
  });

export function useClientTree() {
  return useQuery(clientTreeQueryOptions());
}
