import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

type SkeletonProps = ComponentPropsWithoutRef<'div'>;

/** Decorative placeholder block; announce loading separately (e.g. with `aria-busy` on the region). */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx('animate-pulse rounded bg-skeleton motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
