import { type Company, companySchema, type Dataset } from '@nevis/shared';

import extendedClients from './data/clients.extended.json' with { type: 'json' };
import briefClients from './data/clients.json' with { type: 'json' };

/** Source of the client tree. Async so a database-backed implementation can replace the JSON one. */
export interface ClientsRepository {
  getCompany(dataset: Dataset): Promise<Company>;
}

/** Serves the bundled JSON datasets. Validated once at startup so a broken file fails fast. */
export function createJsonClientsRepository(): ClientsRepository {
  const companies: Record<Dataset, Company> = {
    brief: companySchema.parse(briefClients),
    extended: companySchema.parse(extendedClients),
  };
  return { getCompany: (dataset) => Promise.resolve(companies[dataset]) };
}
