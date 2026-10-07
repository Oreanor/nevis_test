import express, { type Express } from 'express';

import { errorHandler, notFound } from './http/errors';
import { type NetworkSimulation, simulateNetwork } from './http/simulateNetwork';
import type { AvatarCatalog } from './modules/avatars/avatarCatalog';
import { createAvatarsRouter } from './modules/avatars/avatars.router';
import { createClientsRouter } from './modules/clients/clients.router';
import type { ClientsService } from './modules/clients/clients.service';

export interface AppDependencies {
  clients: ClientsService;
  avatars: AvatarCatalog;
  networkSimulation: NetworkSimulation;
}

/** Builds the HTTP app from its dependencies; wiring happens in `composition.ts`, tests inject fakes. */
export function createApp({ clients, avatars, networkSimulation }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(avatars.publicPath, createAvatarsRouter(avatars));

  const api = express.Router();
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  api.use(simulateNetwork(networkSimulation));
  api.use('/clients', createClientsRouter(clients));

  app.use('/api', api);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
