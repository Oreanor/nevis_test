/**
 * Client types, identified in the payload by the name of an employee's channel. The names are the brief's
 * contract; the ids are ours and stay stable for code, colours and URLs.
 */
export const CLIENT_TYPES = [
  { id: 'existing', channelName: 'Existing clients' },
  { id: 'organic', channelName: 'New organic' },
  { id: 'paid', channelName: 'New paid' },
] as const;

export type ClientTypeId = (typeof CLIENT_TYPES)[number]['id'];

/** The client type a channel stands for, or `undefined` for a channel name we do not know. */
export function clientTypeOfChannel(channelName: string): ClientTypeId | undefined {
  return CLIENT_TYPES.find((type) => type.channelName === channelName)?.id;
}

export function isClientTypeId(value: string): value is ClientTypeId {
  return CLIENT_TYPES.some((type) => type.id === value);
}
