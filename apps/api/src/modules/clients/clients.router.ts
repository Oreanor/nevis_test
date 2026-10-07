import { Router } from 'express';
import { z } from 'zod';

import { datasetSchema, DEFAULT_DATASET } from '@nevis/shared';

import { HttpError } from '../../http/errors';
import type { ClientsService } from './clients.service';

const querySchema = z.object({ dataset: datasetSchema.default(DEFAULT_DATASET) });

export function createClientsRouter(service: ClientsService): Router {
  const router = Router();

  // Express 5 forwards rejected promises to the error handler.
  router.get('/', async (req, res) => {
    const query = querySchema.safeParse(req.query);
    if (!query.success) {
      throw new HttpError(400, `Invalid query: dataset must be one of ${datasetSchema.options.join(', ')}`);
    }
    res.json(await service.getCompany(query.data.dataset));
  });

  return router;
}
