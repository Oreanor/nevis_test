import type { AppDependencies } from './app';
import type { AppConfig } from './config';
import { createAvatarCatalog } from './modules/avatars/avatarCatalog';
import { createJsonClientsRepository } from './modules/clients/clients.repository';
import { createClientsService } from './modules/clients/clients.service';

/** Composition root: the only place that chooses concrete implementations. */
export function createDependencies(config: AppConfig): AppDependencies {
  const avatars = createAvatarCatalog({ directory: config.avatarsDir, publicPath: '/avatars' });

  return {
    avatars,
    clients: createClientsService({ repository: createJsonClientsRepository(), avatars }),
    networkSimulation: { delayMs: config.delayMs, failureRate: config.failureRate, random: Math.random },
  };
}
