import { clsx } from 'clsx';

import { useChart } from './ChartContext';
import { Swatch } from './Swatch';

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
          <Swatch color={s.color} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}
