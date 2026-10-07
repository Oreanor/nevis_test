import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/httpClient';

import { createQueryClient } from './queryClient';

const retry = createQueryClient().getDefaultOptions().queries?.retry;
if (typeof retry !== 'function') throw new Error('Expected a retry function');

describe('query retry policy', () => {
  it('retries server and network errors a limited number of times', () => {
    const serverError = new ApiError('http', 'Down', 503);
    expect(retry(0, serverError)).toBe(true);
    expect(retry(1, serverError)).toBe(true);
    expect(retry(2, serverError)).toBe(false);
    expect(retry(0, new ApiError('network', 'Offline'))).toBe(true);
  });

  it('does not retry client errors or invalid responses', () => {
    expect(retry(0, new ApiError('http', 'Not found', 404))).toBe(false);
    expect(retry(0, new ApiError('invalid-response', 'Bad data', 200))).toBe(false);
  });

  it('retries unknown errors', () => {
    expect(retry(0, new Error('Unknown'))).toBe(true);
  });
});
