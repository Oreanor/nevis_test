export const alignClass = { start: 'text-left', end: 'text-right' } as const;

/** Density: compact below `sm`, design spacing from `sm` up. */
export const rowHeightClass = 'h-10 sm:h-14';
const stickyCellClass = 'sticky left-0 z-10 pr-2 pl-2 text-left font-normal sm:pr-3 sm:pl-4';
// From `sm` up every month column is 92px wide with the figure 24px from its right edge (Figma); the
// hierarchy column takes the remaining width.
const valueCellClass = 'px-2 whitespace-nowrap sm:w-23 sm:pr-6 sm:pl-0';

// Row backgrounds, borders and the focus ring are painted on cells: browsers paint <tr> backgrounds per cell
// (leaving hairline seams at fractional widths), ignore outlines on <tr>, and sticky cells cover row borders.
const bodyCellClass = 'border-t border-line';

/**
 * Body cell backgrounds, exactly one per state so utilities never compete. Opaque, because the sticky
 * hierarchy cell must hide figures scrolling underneath it.
 */
export const cellBackground = {
  hierarchy: 'bg-surface group-hover:bg-row-hover group-focus-visible:bg-row-hover',
  value: 'group-hover:bg-row-hover group-focus-visible:bg-row-hover',
  selected: 'bg-row-selected',
  /** Emphasised from outside the table, e.g. the row or month hovered in a linked chart. */
  highlighted: 'bg-row-hover',
};

export const headerCellClass = {
  hierarchy: `${stickyCellClass} min-w-32 bg-surface text-muted sm:min-w-52`,
  // The design sets header labels 2px below the row centre. Opaque so rows scrolling under a sticky header hide.
  value: `${valueCellClass} bg-surface font-normal text-muted sm:pt-1`,
};

/** Selected row: tinted cells (see `cellBackground`) plus an ink bar on the leading edge. */
export const selectedHierarchyCellClass = 'shadow-[inset_3px_0_0_var(--color-ink)]';

export const bodyCellClasses = {
  hierarchy: `${stickyCellClass} whitespace-nowrap ${bodyCellClass} group-focus-visible:shadow-[inset_2px_0_0_var(--color-focus),inset_0_2px_0_var(--color-focus),inset_0_-2px_0_var(--color-focus)]`,
  value: `${valueCellClass} tabular-nums ${bodyCellClass} group-focus-visible:shadow-[inset_0_2px_0_var(--color-focus),inset_0_-2px_0_var(--color-focus)] group-focus-visible:last:shadow-[inset_-2px_0_0_var(--color-focus),inset_0_2px_0_var(--color-focus),inset_0_-2px_0_var(--color-focus)]`,
};
