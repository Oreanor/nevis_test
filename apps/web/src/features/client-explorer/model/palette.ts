/**
 * Series colours of the explorer, validated with the dataviz palette validator against the white card surface
 * (light mode): lightness band, chroma floor, adjacent CVD ΔE ≥ 8 and normal-vision ΔE ≥ 15 all pass.
 * Some light steps sit below 3:1 contrast on white; the relief is the data table under the chart and the
 * tooltip, which always show the numbers. Do not edit values by eye – re-run the validator.
 */

/** Client types: the design's hues, snapped into the validator band (organic/paid were too light/grey). */
export const CLIENT_TYPE_COLORS: Readonly<Record<string, string>> = {
  existing: '#b29df8',
  organic: '#e89081',
  paid: '#a0475e',
};

/**
 * Branches: seven clean hue families spread around the colour wheel, in a validated order (adjacent CVD ΔE ≥ 15.9,
 * normal ΔE ≥ 19). Warm oranges/yellows are left out on purpose: dark shades of them turn brown, and next to
 * each other they are hard to tell apart. Assigned by data order, never cycled: an 8th branch is neutral.
 */
export const BRANCH_COLORS = [
  '#2a78d6', // blue
  '#d23855', // crimson
  '#a34ec6', // purple
  '#1baf7a', // aqua
  '#4a3aa7', // violet
  '#72c436', // lime
  '#c33e93', // magenta
] as const;

/**
 * Advisers: composite encoding – eight shades per branch family (hue ±10°, alternating dark/light) so
 * neighbouring advisers in a stack stay distinct. Every adjacent pair, including family boundaries, passes the
 * validator with all 56 shades in sequence. Index matches `BRANCH_COLORS`.
 */
export const ADVISER_STEPS: readonly (readonly string[])[] = [
  ['#0368a6', '#62b0fe', '#015495', '#6fadfe', '#0250a0', '#79abff', '#2447ae', '#83a8fd'],
  ['#970c46', '#ff7e77', '#990b3d', '#ff7d81', '#9a0b33', '#fe799d', '#9b0f1b', '#fe7a93'],
  ['#692f9c', '#c38dfe', '#6f2c97', '#cb89fa', '#742991', '#d286f4', '#79268b', '#d984ed'],
  ['#046d36', '#1eca7e', '#00814d', '#3ec873', '#04773c', '#0cc7a1', '#048141', '#0cc897'],
  ['#3942ae', '#90a4ff', '#5b35a5', '#a89bfe', '#5438a8', '#a09efe', '#4c3bab', '#98a1fe'],
  ['#799f06', '#016517', '#6bc456', '#046f1c', '#5bc663', '#087820', '#79c24a', '#258101'],
  ['#861d76', '#eb7dd4', '#931057', '#fb78b0', '#90135f', '#f879b9', '#8d1667', '#f47ac2'],
];

/** Series without an identity colour of their own ("Not specified", or beyond the palette's capacity). */
export const NEUTRAL_SERIES_COLOR = '#a8a7a2';
