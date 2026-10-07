import { clsx } from 'clsx';

import { ChevronRightIcon } from '@/shared/ui/icons/ChevronRightIcon';

interface TreeToggleProps {
  isExpanded: boolean;
  label: string;
  onToggle: () => void;
}

/**
 * Pointer affordance for expanding a row. Keyboard users drive expansion from the focused row,
 * so the button stays out of the tab order to keep one tab stop per grid.
 */
export function TreeToggle({ isExpanded, label, onToggle }: TreeToggleProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
      onClick={onToggle}
      className="-m-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-ink hover:bg-black/5"
    >
      <ChevronRightIcon
        className={clsx(
          'size-4 transition-transform motion-reduce:transition-none',
          isExpanded && 'rotate-90',
        )}
      />
    </button>
  );
}
