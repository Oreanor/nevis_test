/** Per-route layout options, set as `handle` on a route object. */
export interface RouteHandle {
  /** The page fills exactly one screen (on screens tall and wide enough) and scrolls inside itself. */
  fullHeight?: boolean;
}

export function isRouteHandle(value: unknown): value is RouteHandle {
  return typeof value === 'object' && value !== null;
}
