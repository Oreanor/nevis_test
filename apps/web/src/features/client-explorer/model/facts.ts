import type { Company, Employee } from '@nevis/shared';

interface Member {
  id: string;
  name: string;
}

interface AdviserMember extends Member {
  avatarUrl?: string;
  /** The adviser's branch, shown as context where the hierarchy does not already include it. */
  branchName: string;
}

/** The finest grain of the data: one adviser's clients of one type, per month. */
export interface ClientFact {
  branch: Member;
  adviser: AdviserMember;
  clientType: Member;
  values: readonly number[];
}

/** Client types are identified by their channel name in the payload; ids are stable across advisers. */
const CLIENT_TYPE_IDS: Record<string, string> = {
  'Existing clients': 'existing',
  'New organic': 'organic',
  'New paid': 'paid',
};

const UNSPECIFIED_TYPE: Member = { id: 'unspecified', name: 'Not specified' };

function clientTypeOf(channelName: string): Member {
  return { id: CLIENT_TYPE_IDS[channelName] ?? `channel:${channelName}`, name: channelName };
}

/**
 * Flattens the company tree into facts. Missing levels are kept rather than dropped, so totals are never lost:
 * an adviser without a client-type split becomes "Not specified", a branch without advisers gets "Unassigned".
 */
export function toFacts(company: Company): ClientFact[] {
  return (company.branches ?? []).flatMap((branch) => {
    const branchMember: Member = { id: branch.id, name: branch.name };
    const advisers: readonly Employee[] = branch.employees?.length
      ? branch.employees
      : [{ id: `${branch.id}:unassigned`, name: 'Unassigned', values: branch.values }];

    return advisers.flatMap((employee) => {
      const adviser: AdviserMember = {
        id: employee.id,
        name: employee.name,
        branchName: branch.name,
        ...(employee.avatarUrl !== undefined && { avatarUrl: employee.avatarUrl }),
      };
      const channels = employee.channels;

      if (!channels?.length)
        return [{ branch: branchMember, adviser, clientType: UNSPECIFIED_TYPE, values: employee.values }];
      return channels.map((channel) => ({
        branch: branchMember,
        adviser,
        clientType: clientTypeOf(channel.name),
        values: channel.values,
      }));
    });
  });
}
