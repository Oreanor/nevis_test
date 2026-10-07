import { useId } from 'react';

import { ChevronRightIcon } from '@/shared/ui/icons/ChevronRightIcon';

import { BREAKDOWN_OPTIONS } from '../model/explorerView';
import type { Breakdown } from '../model/pivot';

interface BreakdownSelectorProps {
  value: Breakdown;
  onChange: (value: Breakdown) => void;
}

const isBreakdown = (value: string): value is Breakdown =>
  BREAKDOWN_OPTIONS.some((option) => option.value === value);

/** Native select: keyboard, screen readers and mobile pickers work without extra code. */
export function BreakdownSelector({ value, onChange }: BreakdownSelectorProps) {
  const id = useId();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-footnote text-muted">
        Break down by
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => {
            if (isBreakdown(event.target.value)) onChange(event.target.value);
          }}
          className="w-full cursor-pointer appearance-none rounded-md bg-page py-1.5 pr-8 pl-2.5 text-body text-ink"
        >
          {BREAKDOWN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRightIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 rotate-90 text-muted" />
      </div>
    </div>
  );
}
