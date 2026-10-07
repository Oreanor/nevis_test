import type { Company, Dataset, Employee } from '@nevis/shared';

import type { AvatarCatalog } from '../avatars/avatarCatalog';
import type { ClientsRepository } from './clients.repository';

export interface ClientsService {
  getCompany(dataset: Dataset): Promise<Company>;
}

interface ClientsServiceDependencies {
  repository: ClientsRepository;
  avatars: Pick<AvatarCatalog, 'urlFor'>;
}

function withAvatar(employee: Employee, avatars: ClientsServiceDependencies['avatars']): Employee {
  const avatarUrl = avatars.urlFor(employee.id);
  return avatarUrl === undefined ? employee : { ...employee, avatarUrl };
}

/**
 * The brief's payload has no avatars but the design shows them, so employees are enriched with the URL of
 * an image we serve. Everything else is passed through untouched (no keys added or removed).
 */
export function createClientsService({ repository, avatars }: ClientsServiceDependencies): ClientsService {
  return {
    async getCompany(dataset) {
      const company = await repository.getCompany(dataset);
      if (!company.branches) return company;

      return {
        ...company,
        branches: company.branches.map((branch) =>
          branch.employees
            ? { ...branch, employees: branch.employees.map((employee) => withAvatar(employee, avatars)) }
            : branch,
        ),
      };
    },
  };
}
