/** Series colour chip; decorative, the series name is always next to it. */
export function Swatch({ color }: { color: string }) {
  return (
    <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
  );
}
