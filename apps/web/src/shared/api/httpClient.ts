import type { z } from 'zod';

import { apiErrorSchema } from '@nevis/shared';

import { env } from '@/shared/config/env';

export type ApiErrorKind = 'network' | 'http' | 'invalid-response';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
  }

  /** Client errors will not go away by retrying the same request. */
  get isRetryable(): boolean {
    return this.kind === 'network' || (this.status !== undefined && this.status >= 500);
  }
}

/** Checks by name so it also works for DOMExceptions from another realm (iframes, test environments). */
const isAbortError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';

function resolveApiUrl(path: string): string {
  return `${env.apiBaseUrl}${path}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const parsed = apiErrorSchema.safeParse(await response.json());
    if (parsed.success) return parsed.data.error.message;
  } catch {
    // Body is not JSON – fall back to the status text below.
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

/** GET a JSON resource and validate it against `schema`, so malformed responses fail loudly at the boundary. */
export async function getJson<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  init: RequestInit = {},
): Promise<z.infer<Schema>> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(resolveApiUrl(path), { ...init, headers });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError('network', 'Could not reach the server. Check your connection.', undefined, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new ApiError('http', await readErrorMessage(response), response.status);
  }

  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) {
    throw new ApiError(
      'invalid-response',
      'The server returned data in an unexpected format.',
      response.status,
      {
        cause: parsed.error,
      },
    );
  }
  return parsed.data;
}
