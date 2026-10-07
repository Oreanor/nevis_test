const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}
