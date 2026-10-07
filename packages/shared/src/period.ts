/**
 * The payload carries bare `values` arrays without dates; the brief states they run Feb 2024 – Jan 2025.
 * Keeping the period here lets API and UI agree on it until the API exposes it explicitly.
 */
export const PERIOD_START = { year: 2024, month: 2 } as const;

export const MONTH_COUNT = 12;
