import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

type CardProps = ComponentPropsWithoutRef<'section'>;

export function Card({ className, ...props }: CardProps) {
  return <section className={clsx('min-w-0 rounded-lg bg-surface', className)} {...props} />;
}
