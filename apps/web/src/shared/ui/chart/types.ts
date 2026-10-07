/** One category on the x axis (e.g. a month) with a value per series key. */
export interface ChartDatum {
  key: string;
  label: string;
  values: Readonly<Record<string, number>>;
}

/** Colours and labels are always supplied by the consumer – the kit has no palette of its own.
 *  `color` is any CSS colour, including `var(--token)`. */
export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SegmentGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StackedSegment {
  datum: ChartDatum;
  series: ChartSeries;
  value: number;
  /** Cumulative value at the bottom of the segment. */
  y0: number;
  /** Cumulative value at the top of the segment. */
  y1: number;
  /** True for the topmost non-empty segment of its stack. */
  isTop: boolean;
}
