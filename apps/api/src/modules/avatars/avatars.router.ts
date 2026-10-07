import express, { type Router } from 'express';

import type { AvatarCatalog } from './avatarCatalog';

export function createAvatarsRouter(catalog: AvatarCatalog): Router {
  const router = express.Router();
  router.use(express.static(catalog.directory, { maxAge: '1d' }));
  return router;
}
