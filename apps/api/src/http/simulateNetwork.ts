import { setTimeout as sleep } from 'node:timers/promises';
import type { RequestHandler } from 'express';

import { HttpError } from './errors';

export interface NetworkSimulation {
  delayMs: number;
  failureRate: number;
  random: () => number;
}

/** Development aid: adds latency and random failures so the UI loading/error states can be exercised. */
export function simulateNetwork({ delayMs, failureRate, random }: NetworkSimulation): RequestHandler {
  return async (_req, _res, next) => {
    if (delayMs > 0) await sleep(delayMs);
    if (failureRate > 0 && random() < failureRate) {
      throw new HttpError(500, 'Simulated server failure');
    }
    next();
  };
}
