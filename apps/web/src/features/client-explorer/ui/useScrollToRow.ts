import { type RefObject, useCallback, useEffect, useState } from 'react';

/**
 * Brings a table row into view once it has rendered (e.g. right after expanding its parent). Inside a
 * scrolling table the row is placed just below the sticky header, which would otherwise cover it.
 */
export function useScrollToRow(containerRef: RefObject<HTMLElement | null>): (rowId: string) => void {
  // A new object per request, so the effect runs once per request – also when the same row is asked again.
  const [request, setRequest] = useState<{ rowId: string } | null>(null);

  useEffect(() => {
    if (request === null) return;

    const rows = containerRef.current?.querySelectorAll<HTMLElement>('tbody tr[data-row-id]') ?? [];
    const row = [...rows].find((element) => element.dataset.rowId === request.rowId);
    const scroller = row?.closest('table')?.parentElement;
    if (!row || !scroller) return;

    if (scroller.scrollHeight > scroller.clientHeight) {
      const headerHeight = scroller.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      const top = row.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top: top - headerHeight, behavior: 'smooth' });
    } else {
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [request, containerRef]);

  return useCallback((rowId: string) => setRequest({ rowId }), []);
}
