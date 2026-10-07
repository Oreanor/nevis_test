import { Avatar } from '@/shared/ui/Avatar';

import type { PivotNode } from '../model/pivot';
import { Swatch } from './Swatch';

interface ExplorerRowNameProps {
  node: PivotNode;
  /** Colour of the node when it is a series of the current chart. */
  seriesColor?: string;
}

export function ExplorerRowName({ node, seriesColor }: ExplorerRowNameProps) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {seriesColor && <Swatch color={seriesColor} />}
      {node.dimension === 'adviser' && <Avatar name={node.name} src={node.avatarUrl} size={20} />}
      <span className="truncate">{node.name}</span>
      {node.context && (
        <span className="truncate text-footnote text-muted">
          {/* Separates name and context in the accessible name ("James, Branch 1"). */}
          <span className="sr-only">, </span>
          {node.context}
        </span>
      )}
    </span>
  );
}
