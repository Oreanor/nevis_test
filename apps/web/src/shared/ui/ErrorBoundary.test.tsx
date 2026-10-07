import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { silenceConsoleError } from '@/test/silenceConsoleError';

import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
function Flaky() {
  if (shouldThrow) throw new Error('Render failed');
  return <p>Recovered</p>;
}

describe('ErrorBoundary', () => {
  it('renders the fallback with the error and recovers on reset', async () => {
    silenceConsoleError();
    shouldThrow = true;
    const user = userEvent.setup();

    render(
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <button type="button" onClick={reset}>
            {error.message}
          </button>
        )}
      >
        <Flaky />
      </ErrorBoundary>,
    );

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Render failed' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('reports errors to onError instead of the console', () => {
    silenceConsoleError();
    shouldThrow = true;
    const onError = vi.fn();

    render(
      <ErrorBoundary fallback={() => 'failed'} onError={onError}>
        <Flaky />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Render failed' }),
      expect.anything(),
    );
  });

  it('leaves siblings outside the boundary untouched', () => {
    silenceConsoleError();
    shouldThrow = true;
    function Page() {
      const [label] = useState('Sibling');
      return (
        <>
          <p>{label}</p>
          <ErrorBoundary fallback={() => <p>Widget failed</p>}>
            <Flaky />
          </ErrorBoundary>
        </>
      );
    }

    render(<Page />);
    expect(screen.getByText('Sibling')).toBeInTheDocument();
    expect(screen.getByText('Widget failed')).toBeInTheDocument();
  });
});
