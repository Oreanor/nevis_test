import { type RefCallback, useCallback, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Tracks an element's content-box size. Returns a callback ref, so it works with conditionally
 * rendered elements. Without ResizeObserver (e.g. jsdom) the size stays at its initial reading.
 */
export function useElementSize<T extends Element>(): [RefCallback<T>, ElementSize] {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  const ref = useCallback<RefCallback<T>>((element) => {
    if (!element) return;

    const update = (width: number, height: number) =>
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));

    const rect = element.getBoundingClientRect();
    update(rect.width, rect.height);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
