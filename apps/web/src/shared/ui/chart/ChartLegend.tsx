import { clsx } from 'clsx';

import { useChart } from './ChartContext';

interface ChartLegendProps {
  className?: string;
}

/** Series key: a plain list, so it works for assistive technology with or without `ChartDataTable`. */
export function ChartLegend({ className }: ChartLegendProps) {
  const { series } = useChart();

  return (
    <ul
      aria-label="Legend"
      className={clsx('flex flex-wrap justify-center gap-x-4 gap-y-1 text-footnote text-muted', className)}
    >
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: s.color }}
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}
