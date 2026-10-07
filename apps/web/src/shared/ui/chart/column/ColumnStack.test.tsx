import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { stackData } from '../stack';
import type { ChartDatum, ChartSeries } from '../types';
import { ColumnStack } from './ColumnStack';
import { ColumnYAxis } from './ColumnYAxis';
import { createStackScale } from './stackScale';

const series: ChartSeries[] = [
  { key: 'x', label: 'X', color: 'red' },
  { key: 'y', label: 'Y', color: 'blue' },
];
const data: ChartDatum[] = [
  { key: 'jan', label: 'Jan', values: { x: 30, y: 10 } },
  { key: 'feb', label: 'Feb', values: { x: 20, y: 0 } },
];
const stacks = stackData(data, series);
// 0..40 over 110px with 10px top padding → 100px for 40 units: 1 unit = 2.5px.
const scale = createStackScale(stacks, { height: 110, paddingTop: 10, tickCount: 4 });
const [jan = [], feb = []] = stacks;

const segmentRects = (container: HTMLElement) => [
  ...container.querySelectorAll<SVGRectElement>('[data-chart-layer="bars"] rect[data-series]'),
];

describe('createStackScale', () => {
  it('shares one nice y scale across columns', () => {
    expect(scale.ticks).toEqual([0, 10, 20, 30, 40]);
    expect(scale.yScale(0)).toBe(110);
    expect(scale.yScale(40)).toBe(10);
  });
});

describe('ColumnStack', () => {
  it('draws the stack bottom to top on the shared scale', () => {
    const { container } = render(<ColumnStack segments={jan} scale={scale} barWidth={0.5} />);

    expect(
      segmentRects(container).map((r) => [r.dataset.series, r.getAttribute('y'), r.getAttribute('height')]),
    ).toEqual([
      ['x', '35', '75'],
      ['y', '10', '25'],
    ]);
    expect(segmentRects(container)[0]).toHaveAttribute('x', '25%');
    expect(segmentRects(container)[0]).toHaveAttribute('width', '50%');
  });

  it('skips empty segments and rounds the whole bar by clipping', () => {
    const { container } = render(<ColumnStack segments={feb} scale={scale} radius={4} />);

    expect(segmentRects(container).map((r) => r.dataset.series)).toEqual(['x']);
    expect(container.querySelector('clipPath rect')).toHaveAttribute('rx', '4');
    expect(container.querySelector('clipPath rect')).toHaveAttribute('height', '50');
  });

  it('dims every series but the highlighted one', () => {
    const { container } = render(<ColumnStack segments={jan} scale={scale} highlightedSeries="y" />);
    const [x, y] = segmentRects(container);

    expect(x).toHaveClass('opacity-25');
    expect(y).not.toHaveClass('opacity-25');
  });

  it('marks part of a segment from its bottom', () => {
    const { container } = render(
      <ColumnStack segments={jan} scale={scale} overlay={{ seriesKey: 'y', value: 4 }} />,
    );
    const overlay = container.querySelector('[data-chart-layer="overlay"]');

    // y segment spans 30..40 → overlay 30..34 → pixels 35 (bottom) to 25.
    expect([overlay?.getAttribute('y'), overlay?.getAttribute('height')]).toEqual(['25', '10']);
  });

  it('reports hovered segments', async () => {
    const onSegmentEnter = vi.fn();
    const { container } = render(
      <ColumnStack segments={jan} scale={scale} onSegmentEnter={onSegmentEnter} />,
    );
    const { default: userEvent } = await import('@testing-library/user-event');

    await userEvent.hover(segmentRects(container)[1] as Element);

    expect(onSegmentEnter).toHaveBeenCalledWith(expect.objectContaining({ value: 10 }));
  });

  it('reports clicked segments', async () => {
    const onSegmentClick = vi.fn();
    const { container } = render(
      <ColumnStack segments={jan} scale={scale} onSegmentClick={onSegmentClick} />,
    );
    const { default: userEvent } = await import('@testing-library/user-event');

    await userEvent.click(segmentRects(container)[1] as Element);

    expect(onSegmentClick).toHaveBeenCalledWith(expect.objectContaining({ value: 10 }));
  });

  it('draws dotted grid lines at the ticks', () => {
    const { container } = render(<ColumnStack segments={jan} scale={scale} />);
    expect(container.querySelectorAll('[data-chart-layer="grid"] line')).toHaveLength(5);
  });
});

describe('ColumnYAxis', () => {
  it('labels the shared ticks, right-aligned', () => {
    const { container } = render(<ColumnYAxis scale={scale} width={30} />);
    const labels = [...container.querySelectorAll('text')];

    expect(labels.map((t) => t.textContent)).toEqual(['0', '10', '20', '30', '40']);
    expect(labels.at(-1)).toHaveAttribute('y', '14');
    expect(labels[0]).toHaveAttribute('x', '30');
  });
});
