import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('shows the image when a source is given', () => {
    const { container } = render(<Avatar name="Anna Blackwood" src="/avatars/anna.svg" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/avatars/anna.svg');
  });

  it('falls back to initials when there is no image', () => {
    const { container } = render(<Avatar name="Anna Blackwood" />);
    expect(container).toHaveTextContent('AB');
    expect(container.querySelector('img')).toBeNull();
  });

  it('falls back to initials when the image fails to load', () => {
    const { container } = render(<Avatar name="Anna Blackwood" src="/broken.svg" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container).toHaveTextContent('AB');
  });

  it('tries again when the source changes after a failure', () => {
    const { container, rerender } = render(<Avatar name="Anna Blackwood" src="/broken.svg" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    rerender(<Avatar name="Anna Blackwood" src="/fixed.svg" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/fixed.svg');
  });

  it('is hidden from assistive technology because the name is rendered next to it', () => {
    const { container } = render(<Avatar name="Anna Blackwood" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
