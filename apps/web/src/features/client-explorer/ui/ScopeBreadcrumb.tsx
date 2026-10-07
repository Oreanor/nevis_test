import type { PivotNode } from '../model/pivot';

interface ScopeBreadcrumbProps {
  /** From the root to the current scope. */
  path: readonly PivotNode[];
  onSelect: (id: string) => void;
}

/** Where the chart is focused, with a way back up. */
export function ScopeBreadcrumb({ path, onSelect }: ScopeBreadcrumbProps) {
  return (
    <nav aria-label="Chart scope" className="min-w-0">
      <ol className="flex flex-wrap items-baseline gap-x-1 text-footnote text-muted">
        {path.map((node, index) => {
          const isCurrent = index === path.length - 1;
          return (
            <li key={node.id} className="flex min-w-0 items-baseline gap-x-1">
              {index > 0 && <span aria-hidden="true">›</span>}
              {isCurrent ? (
                <span aria-current="location" className="truncate font-medium text-ink">
                  {node.name}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(node.id)}
                  className="cursor-pointer truncate underline-offset-2 hover:text-ink hover:underline"
                >
                  {node.name}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
