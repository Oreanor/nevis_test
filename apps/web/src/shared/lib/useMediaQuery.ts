import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query. Returns `fallback` where `matchMedia` is unavailable (e.g. jsdom),
 * so tests render the default layout unless they stub `matchMedia`.
 */
export function useMediaQuery(query: string, fallback = true): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = () =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback;

  return useSyncExternalStore(subscribe, getSnapshot, () => fallback);
}
