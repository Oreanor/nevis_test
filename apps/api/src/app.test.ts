import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { apiErrorSchema, companySchema } from '@nevis/shared';

import { type AppDependencies, createApp } from './app';
import { createDependencies } from './composition';
import { readConfig } from './config';

function makeApp(overrides: Partial<AppDependencies> = {}) {
  return createApp({ ...createDependencies(readConfig({})), ...overrides });
}

describe('GET /api/clients', () => {
  it('returns the company tree matching the shared schema', async () => {
    const res = await request(makeApp()).get('/api/clients').expect(200);

    const company = companySchema.parse(res.body);
    expect(company.name).toBe('Company');
    expect(company.values).toEqual([250, 267, 284, 301, 317, 334, 350, 250, 250, 250, 250, 350]);
    expect(company.branches?.map((b) => b.name)).toEqual(['Branch 1', 'Branch 2', 'Branch 3']);
  });

  it('keeps the non-uniform nesting from the brief', async () => {
    const { body } = await request(makeApp()).get('/api/clients');
    const [branch1, branch2, branch3] = companySchema.parse(body).branches ?? [];

    expect(branch1?.employees).toHaveLength(5);
    expect(branch2).not.toHaveProperty('employees');
    expect(branch3).not.toHaveProperty('employees');
    expect(branch1?.employees?.filter((e) => e.channels).map((e) => e.name)).toEqual(['Anna Blackwood']);
  });

  it('adds avatar URLs that are served by the API', async () => {
    const app = makeApp();
    const { body } = await request(app).get('/api/clients');
    const anna = companySchema.parse(body).branches?.[0]?.employees?.[0];

    expect(anna?.avatarUrl).toBe('/avatars/e3c4637b-2f21-4b7e-883e-b13ae1a6df6a.png');
    const image = await request(app)
      .get(anna?.avatarUrl ?? '')
      .expect(200);
    expect(image.headers['content-type']).toBe('image/png');
  });

  it('responds with a JSON error when a failure is simulated', async () => {
    const app = makeApp({ networkSimulation: { delayMs: 0, failureRate: 1, random: () => 0 } });
    const res = await request(app).get('/api/clients').expect(500);

    expect(apiErrorSchema.parse(res.body).error.message).toBe('Simulated server failure');
  });

  it('hides internal error details from clients', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failing = { getCompany: () => Promise.reject(new Error('connection string leaked')) };
    const res = await request(makeApp({ clients: failing }))
      .get('/api/clients')
      .expect(500);

    expect(apiErrorSchema.parse(res.body).error.message).toBe('Internal server error');
  });
});

describe('GET /api/clients?dataset=extended', () => {
  it('serves the extended dataset with advisers in every branch', async () => {
    const res = await request(makeApp()).get('/api/clients?dataset=extended').expect(200);
    const branches = companySchema.parse(res.body).branches ?? [];

    expect(branches.map((branch) => branch.employees?.length ?? 0)).toEqual([5, 4, 3]);
  });

  it('defaults to the brief payload', async () => {
    const res = await request(makeApp()).get('/api/clients').expect(200);
    expect(companySchema.parse(res.body).branches?.[1]).not.toHaveProperty('employees');
  });

  it('rejects an unknown dataset with 400', async () => {
    const res = await request(makeApp()).get('/api/clients?dataset=nope').expect(400);
    expect(apiErrorSchema.parse(res.body).error.message).toContain('brief, extended');
  });
});

describe('unknown routes', () => {
  it('returns 404 with a JSON error body', async () => {
    const res = await request(makeApp()).get('/api/nope').expect(404);

    expect(apiErrorSchema.parse(res.body).error.message).toContain('/api/nope');
  });
});

describe('GET /api/health', () => {
  it('reports ok', async () => {
    await request(makeApp()).get('/api/health').expect(200, { status: 'ok' });
  });
});
