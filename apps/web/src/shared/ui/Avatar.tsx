import { clsx } from 'clsx';
import { useState } from 'react';

import { getInitials } from '@/shared/lib/initials';

interface AvatarProps {
  name: string;
  src?: string;
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/**
 * Decorative: the person's name is always rendered next to it, so the avatar is hidden from
 * assistive technology. Falls back to initials when there is no image or it fails to load.
 */
export function Avatar({ name, src, size = 20, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = src !== undefined && failedSrc !== src;

  return (
    <span
      aria-hidden="true"
      className={clsx(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-skeleton font-medium text-muted select-none',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
