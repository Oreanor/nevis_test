import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { silenceConsoleError } from '@/test/silenceConsoleError';

import { ChartCanvas } from './ChartCanvas';
import { useChart } from './ChartContext';
import { ChartDataTable } from './ChartDataTable';
import { ChartLegend } from './ChartLegend';
import { ChartRoot } from './ChartRoot';
import { GridLines } from './GridLines';
import { StackedBars } from './StackedBars';
import type { ChartDatum, ChartSeries } from './types';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';

const series: ChartSeries[] = [
  { key: 'x', label: 'Series X', color: 'red' },
  { key: 'y', label: 'Series Y', color: 'blue' },
];
const data: ChartDatum[] = [
  { key: 'jan', label: 'Jan', values: { x: 30, y: 10 } },
  { key: 'feb', label: 'Feb', values: { x: 20, y: 0 } },
];
const margin = { top: 0, right: 0, bottom: 0, left: 0 };

function renderChart() {
  return render(
    <ChartRoot data={data} series={series} width={200} height={100} margin={margin} yTickCount={4}>
      <ChartCanvas>
        <GridLines />
        <YAxis />
        <XAxis />
        <StackedBars radius={2} />
      </ChartCanvas>
      <ChartLegend />
      <ChartDataTable caption="Test chart" />
    </ChartRoot>,
  );
}

const segments = (container: HTMLElement) => [...container.querySelectorAll<SVGRectElement>('[data-series]')];

describe('chart kit', () => {
  it('renders one segment per non-zero value with its series and value', () => {
    const { container } = renderChart();

    expect(
      segments(container).map((s) => [
        s.closest('[data-datum]')?.getAttribute('data-datum'),
        s.dataset.series,
        s.dataset.value,
      ]),
    ).toEqual([
      ['jan', 'x', '30'],
      ['jan', 'y', '10'],
      ['feb', 'x', '20'],
    ]);
  });

  it('scales segment heights to the nice y domain', () => {
    // Max stack 40 with 4 ticks → domain 0..40 over a 100px plot (1 unit = 2.5px);
    // 2 bands over 200px with 0.2 padding → step 100, band 80, first band at x=10.
    const { container } = renderChart();
    const [janX] = segments(container);
    expect(['x', 'y', 'width', 'height'].map((name) => janX?.getAttribute(name))).toEqual([
      '10',
      '25',
      '80',
      '75',
    ]);
  });

  it('rounds each whole stack by clipping it to a rounded rectangle', () => {
    const { container } = renderChart();
    const jan = container.querySelector('[data-datum="jan"]');
    const clipId = jan?.getAttribute('clip-path')?.match(/^url\(#(.+)\)$/)?.[1] ?? '';
    const clipRect = jan?.querySelector('clipPath rect');

    expect(jan?.querySelector('clipPath')?.id).toBe(clipId);
    // Covers the whole stack (40 units = 100px tall from y 0) with the requested radius.
    expect(['x', 'y', 'width', 'height', 'rx'].map((name) => clipRect?.getAttribute(name))).toEqual([
      '10',
      '0',
      '80',
      '100',
      '2',
    ]);
  });

  it('renders axis labels and grid lines from the data', () => {
    const { container } = renderChart();

    const yLabels = container.querySelectorAll('[data-chart-layer="y-axis"] text');
    expect([...yLabels].map((t) => t.textContent)).toEqual(['0', '10', '20', '30', '40']);
    const xLabels = container.querySelectorAll('[data-chart-layer="x-axis"] text');
    expect([...xLabels].map((t) => t.textContent)).toEqual(['Jan', 'Feb']);
    expect(container.querySelectorAll('[data-chart-layer="grid"] line')).toHaveLength(5);
  });

  it('exposes the values to assistive technology as a table', () => {
    renderChart();

    const table = screen.getByRole('table', { name: 'Test chart' });
    const rows = within(table).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual([
      'SeriesJanFeb',
      'Series X3020',
      'Series Y100',
      'Total4020',
    ]);
  });

  it('renders a legend entry per series', () => {
    const { container } = renderChart();
    expect([...container.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Series X',
      'Series Y',
    ]);
  });

  it('supports custom layers through useChart', () => {
    function BarCount() {
      const { stacks } = useChart();
      return <text>{stacks.length} bars</text>;
    }
    render(
      <ChartRoot data={data} series={series} width={100} height={50}>
        <ChartCanvas>
          <BarCount />
        </ChartCanvas>
      </ChartRoot>,
    );
    expect(screen.getByText('2 bars')).toBeInTheDocument();
  });

  it('throws a helpful error when a layer is used outside ChartRoot', () => {
    silenceConsoleError();
    expect(() => render(<GridLines />)).toThrow('useChart must be used inside <ChartRoot>');
  });
});
