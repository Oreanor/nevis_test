import axe, { type Result, type RunOptions } from 'axe-core';
import { expect } from 'vitest';

const DEFAULT_OPTIONS: RunOptions = {
  rules: {
    // jsdom has no layout or canvas, so contrast cannot be computed; check it in a real browser instead.
    'color-contrast': { enabled: false },
    // Components are tested in isolation, outside the page landmarks.
    region: { enabled: false },
  },
};

function formatViolations(violations: Result[]): string {
  return violations
    .map(
      (v) =>
        `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n` +
        v.nodes.map((node) => `  - ${node.target.join(' ')}\n    ${node.failureSummary ?? ''}`).join('\n'),
    )
    .join('\n\n');
}

/** Runs axe-core against `container` and fails with a readable report if anything is violated. */
export async function expectNoAxeViolations(container: Element, options: RunOptions = {}) {
  const { violations } = await axe.run(container, {
    ...DEFAULT_OPTIONS,
    ...options,
    rules: { ...DEFAULT_OPTIONS.rules, ...options.rules },
  });
  expect(violations, formatViolations(violations)).toHaveLength(0);
}
