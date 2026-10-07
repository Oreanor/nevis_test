import type { ErrorRequestHandler, RequestHandler } from 'express';

import type { ApiErrorBody } from '@nevis/shared';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route ${req.method} ${req.path} not found`));
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;
  // Never leak internals of unexpected errors to the client.
  const message = err instanceof HttpError ? err.message : 'Internal server error';
  if (status >= 500) console.error(err);

  const body: ApiErrorBody = { error: { message } };
  res.status(status).json(body);
};
