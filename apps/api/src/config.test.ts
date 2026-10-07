import { describe, expect, it } from 'vitest';

import { readConfig } from './config';

describe('readConfig', () => {
  it('applies defaults', () => {
    expect(readConfig({})).toMatchObject({ port: 3001, delayMs: 0, failureRate: 0 });
  });

  it('parses provided values', () => {
    expect(readConfig({ PORT: '8080', API_DELAY_MS: '250', API_FAILURE_RATE: '0.5' })).toMatchObject({
      port: 8080,
      delayMs: 250,
      failureRate: 0.5,
    });
  });

  it.each([
    [{ PORT: 'abc' }, 'PORT'],
    [{ API_DELAY_MS: '-1' }, 'API_DELAY_MS'],
    [{ API_FAILURE_RATE: '2' }, 'API_FAILURE_RATE'],
  ])('fails fast on invalid values: %j', (env, variable) => {
    expect(() => readConfig(env)).toThrow(variable);
  });
});
