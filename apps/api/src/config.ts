import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export interface AppConfig {
  port: number;
  /** Artificial latency for /api routes, to make the UI loading state visible in development. */
  delayMs: number;
  /** Probability (0..1) that an /api request fails with 500, to exercise the UI error state. */
  failureRate: number;
  avatarsDir: string;
}

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  API_DELAY_MS: z.coerce.number().int().min(0).default(0),
  API_FAILURE_RATE: z.coerce.number().min(0).max(1).default(0),
});

// Resolves to apps/api both from src/ (dev) and from the bundled dist/ (production).
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Reads and validates the environment; fails fast on invalid values instead of silently defaulting. */
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }

  return {
    port: parsed.data.PORT,
    delayMs: parsed.data.API_DELAY_MS,
    failureRate: parsed.data.API_FAILURE_RATE,
    avatarsDir: path.join(apiRoot, 'public', 'avatars'),
  };
}
