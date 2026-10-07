import { clsx } from 'clsx';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={clsx(
        'flex flex-col items-center gap-3 rounded-lg bg-surface px-4 py-12 text-center',
        className,
      )}
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-prose text-body text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-1 rounded-md bg-ink px-4 py-2 text-body font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isRetrying ? 'Retrying…' : retryLabel}
        </button>
      )}
    </div>
  );
}
