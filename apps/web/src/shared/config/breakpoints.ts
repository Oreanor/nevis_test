/**
 * Media queries matching Tailwind's breakpoints (`sm` = 40rem). Use Tailwind variants for styling;
 * these are for the few layout values that must be known in JS (e.g. chart dimensions).
 */
export const mediaQueries = {
  sm: '(min-width: 40rem)',
} as const;
