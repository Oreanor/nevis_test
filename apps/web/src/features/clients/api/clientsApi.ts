import { type Company, companySchema } from '@nevis/shared';

import { getJson } from '@/shared/api/httpClient';

export function fetchCompany(signal?: AbortSignal): Promise<Company> {
  return getJson('/api/clients', companySchema, { signal });
}
