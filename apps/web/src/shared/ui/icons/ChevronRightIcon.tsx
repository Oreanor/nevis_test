import type { SVGProps } from 'react';

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* 3.5 × 7 at 16px, as in the Figma component */}
      <path d="M6.25 4.5 9.75 8l-3.5 3.5" />
    </svg>
  );
}
