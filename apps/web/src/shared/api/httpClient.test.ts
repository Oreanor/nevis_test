import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiError, getJson } from './httpClient';

const schema = z.object({ name: z.string() });

function stubFetch(result: Response | { throws: unknown }) {
  const fetchMock = vi.fn(() =>
    result instanceof Response ? Promise.resolve(result) : Promise.reject(result.throws),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, ...init });

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  if (!(error instanceof ApiError)) throw new Error(`Expected ApiError, got ${String(error)}`);
  return error;
}

describe('getJson', () => {
  it('returns validated data and sends an Accept header', async () => {
    const fetchMock = stubFetch(json({ name: 'Company', extra: true }));

    await expect(getJson('/api/thing', schema)).resolves.toEqual({ name: 'Company' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/thing');
    expect(new Headers(init.headers).get('Accept')).toBe('application/json');
  });

  it('keeps caller headers, including Headers instances', async () => {
    const fetchMock = stubFetch(json({ name: 'Company' }));

    await getJson('/api/thing', schema, { headers: new Headers({ 'X-Trace': 'abc' }) });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).get('X-Trace')).toBe('abc');
  });

  it('uses the message from a JSON error body', async () => {
    stubFetch(json({ error: { message: 'Boom' } }, { status: 503 }));

    const error = await captureError(getJson('/api/thing', schema));
    expect(error).toMatchObject({ kind: 'http', status: 503, message: 'Boom', isRetryable: true });
  });

  it('falls back to the status text for non-JSON errors', async () => {
    stubFetch(new Response('<html>', { status: 404, statusText: 'Not Found' }));

    const error = await captureError(getJson('/api/thing', schema));
    expect(error).toMatchObject({ kind: 'http', status: 404, message: 'Not Found', isRetryable: false });
  });

  it('reports network failures as retryable', async () => {
    stubFetch({ throws: new TypeError('Failed to fetch') });

    const error = await captureError(getJson('/api/thing', schema));
    expect(error).toMatchObject({ kind: 'network', isRetryable: true });
    expect(error.cause).toBeInstanceOf(TypeError);
  });

  it('rejects payloads that do not match the schema', async () => {
    stubFetch(json({ name: 42 }));

    const error = await captureError(getJson('/api/thing', schema));
    expect(error).toMatchObject({ kind: 'invalid-response', isRetryable: false });
  });

  it('rejects responses that are not JSON', async () => {
    stubFetch(new Response('not json', { status: 200 }));

    const error = await captureError(getJson('/api/thing', schema));
    expect(error.kind).toBe('invalid-response');
  });

  it('rethrows aborts untouched so query cancellation is not reported as an error', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    stubFetch({ throws: abort });

    await expect(getJson('/api/thing', schema)).rejects.toBe(abort);
  });
});
