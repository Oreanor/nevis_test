import { useChart } from './ChartContext';

interface ChartDataTableProps {
  caption: string;
  valueFormat?: (value: number) => string;
  /** Visually hidden by default; pass `false` to show it (e.g. a "view as table" toggle). */
  visuallyHidden?: boolean;
}

/** Text alternative for the chart: one row per series, one column per category, plus totals. */
export function ChartDataTable({
  caption,
  valueFormat = String,
  visuallyHidden = true,
}: ChartDataTableProps) {
  const { data, stacks, series } = useChart();

  // The wrapper carries `sr-only`: a <table> cannot shrink below its content and would overflow the page.
  return (
    <div className={visuallyHidden ? 'sr-only' : 'overflow-x-auto'}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Series</th>
            {data.map((datum) => (
              <th key={datum.key} scope="col">
                {datum.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((s, seriesIndex) => (
            <tr key={s.key}>
              <th scope="row">{s.label}</th>
              {stacks.map((segments, i) => (
                <td key={data[i]?.key ?? i}>{valueFormat(segments[seriesIndex]?.value ?? 0)}</td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            {stacks.map((segments, i) => (
              <td key={data[i]?.key ?? i}>{valueFormat(segments.at(-1)?.y1 ?? 0)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
