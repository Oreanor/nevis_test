import { Avatar } from '@/shared/ui/Avatar';

import type { ClientNode } from '../model/clientTree';

interface ClientRowNameProps {
  node: ClientNode;
}

export function ClientRowName({ node }: ClientRowNameProps) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {node.kind === 'employee' && <Avatar name={node.name} src={node.avatarUrl} size={20} />}
      <span className="truncate">{node.name}</span>
    </span>
  );
}
