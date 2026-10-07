/**
 * Generates `src/modules/clients/data/clients.extended.json`: the brief's payload extended so every branch has
 * advisers and every adviser has a client-type split, with every parent equal to the sum of its children.
 *
 * Brief figures are kept wherever the brief has them (adviser totals, Anna Blackwood's new clients); parent totals
 * are recomputed from their children, which corrects the few places where the brief does not add up.
 *
 * Deterministic (seeded), so re-running it produces the same file. Run: `npm run generate:extended -w @nevis/api`.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type Branch,
  type Channel,
  CLIENT_TYPES,
  type ClientTypeId,
  clientTypeOfChannel,
  type Company,
  companySchema,
  type Employee,
  MONTH_COUNT,
} from '@nevis/shared';

import brief from '../src/modules/clients/data/clients.json' with { type: 'json' };

const SEED = 20_241_001;
const OUTPUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/modules/clients/data/clients.extended.json',
);

/** New advisers for the branches that have none in the brief (their monthly totals are kept). */
const NEW_ADVISERS: Record<string, readonly string[]> = {
  'Branch 2': ['Olivia Martin', 'Daniel Kim', 'Priya Patel', 'Lucas Moreau'],
  'Branch 3': ['Emma Johansson', 'Noah Williams', 'Chloe Dubois'],
};

/** Typical share of new clients per month, as a fraction of an adviser's total. */
const NEW_ORGANIC_SHARE = [0.02, 0.06] as const;
const NEW_PAID_SHARE = [0.02, 0.05] as const;

/** mulberry32: tiny, fast and good enough for demo data. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const random = createRandom(SEED);
const between = ([min, max]: readonly [number, number]) => min + random() * (max - min);

function uuid(): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16));
  hex[12] = '4';
  hex[16] = ((Number.parseInt(hex[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

/** Splits `total` into integer parts proportional to `weights` that add up exactly (largest remainder). */
function splitInteger(total: number, weights: readonly number[]): number[] {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const exact = weights.map((w) => (total * w) / weightSum);
  const parts = exact.map(Math.floor);
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  const missing = total - parts.reduce((sum, p) => sum + p, 0);
  for (const { index } of order.slice(0, missing)) parts[index] = (parts[index] ?? 0) + 1;
  return parts;
}

const sumValues = (nodes: readonly { values: readonly number[] }[]) =>
  Array.from({ length: MONTH_COUNT }, (_, month) =>
    nodes.reduce((sum, node) => sum + (node.values[month] ?? 0), 0),
  );

/** Random monthly counts of one kind of new client: a share of each month's total, with some noise. */
function newClients(totals: readonly number[], share: readonly [number, number]): number[] {
  const typical = between(share);
  return totals.map((total) => Math.round(total * typical * between([0.6, 1.4])));
}

/**
 * Client-type split of an adviser's monthly totals. New clients are kept from the brief where it has them and
 * generated otherwise; existing clients are the remainder, so the types always add up to the adviser's total.
 */
function splitByClientType(totals: readonly number[], channels: readonly Channel[] = []): Channel[] {
  const channelOf = (type: ClientTypeId) =>
    channels.find((channel) => clientTypeOfChannel(channel.name) === type);
  const organic = channelOf('organic')?.values ?? newClients(totals, NEW_ORGANIC_SHARE);
  const paid = channelOf('paid')?.values ?? newClients(totals, NEW_PAID_SHARE);
  const values: Record<ClientTypeId, readonly number[]> = {
    existing: totals.map((total, month) => total - (organic[month] ?? 0) - (paid[month] ?? 0)),
    organic,
    paid,
  };
  return CLIENT_TYPES.map(({ id, channelName }) => ({
    id: channelOf(id)?.id ?? uuid(),
    name: channelName,
    values: [...values[id]],
  }));
}

function withClientTypes(employee: Employee): Employee {
  return { ...employee, channels: splitByClientType(employee.values, employee.channels) };
}

function newAdvisers(branch: Branch, names: readonly string[]): Employee[] {
  // Stable per-adviser weights with a little month-to-month noise, so advisers differ but stay plausible.
  const weights = names.map(() => between([0.6, 1.4]));
  const perMonth = branch.values.map((total) =>
    splitInteger(
      total,
      weights.map((w) => w * between([0.9, 1.1])),
    ),
  );
  return names.map((name, index) =>
    withClientTypes({ id: uuid(), name, values: perMonth.map((parts) => parts[index] ?? 0) }),
  );
}

function extendBranch(branch: Branch): Branch {
  const employees = branch.employees
    ? branch.employees.map(withClientTypes)
    : newAdvisers(branch, NEW_ADVISERS[branch.name] ?? []);
  return { ...branch, values: sumValues(employees), employees };
}

const source = companySchema.parse(brief);
const branches = (source.branches ?? []).map(extendBranch);
const extended: Company = { ...source, values: sumValues(branches), branches };

writeFileSync(OUTPUT, `${JSON.stringify(companySchema.parse(extended), null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), OUTPUT)}`);
