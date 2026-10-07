interface Searchable {
  label: string;
  description?: string;
}

/** Case- and accent-insensitive form used for matching: decompose, then drop non-spacing marks. */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase();

/** Options whose label or description contains the query, ignoring case and accents. */
export function filterOptions<T extends Searchable>(options: readonly T[], query: string): T[] {
  const q = normalize(query.trim());
  if (!q) return [...options];
  return options.filter((o) => normalize(`${o.label} ${o.description ?? ''}`).includes(q));
}
