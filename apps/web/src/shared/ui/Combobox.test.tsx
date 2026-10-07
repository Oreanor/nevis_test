import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { filterOptions } from '@/shared/lib/filterOptions';
import { expectNoAxeViolations } from '@/test/axe';

import { Combobox, type ComboboxOption } from './Combobox';

const options: ComboboxOption[] = [
  { id: 'anna', label: 'Anna Blackwood', description: 'Branch 1' },
  { id: 'chloe', label: 'Chloé Dubois', description: 'Branch 3' },
  { id: 'james', label: 'James Walker', description: 'Branch 1' },
];

function renderCombobox() {
  const onChange = vi.fn();
  const onActiveChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Combobox
      label="Advisers"
      options={options}
      value={null}
      onChange={onChange}
      onActiveChange={onActiveChange}
    />,
  );
  return { user, onChange, onActiveChange, input: screen.getByRole('combobox', { name: 'Advisers' }) };
}

const optionNames = () => screen.queryAllByRole('option').map((o) => o.textContent);

describe('filterOptions', () => {
  it('matches label or description, ignoring case and accents', () => {
    expect(filterOptions(options, 'CHLOE').map((o) => o.id)).toEqual(['chloe']);
    expect(filterOptions(options, 'branch 1').map((o) => o.id)).toEqual(['anna', 'james']);
    expect(filterOptions(options, '  ')).toHaveLength(3);
  });
});

describe('Combobox', () => {
  it('opens on focus and filters while typing', async () => {
    const { user, input } = renderCombobox();

    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(optionNames()).toHaveLength(3);

    await user.type(input, 'wal');
    expect(optionNames()).toEqual(['James Walker, Branch 1']);
  });

  it('picks the active option with the keyboard and reports the active one', async () => {
    const { user, input, onChange, onActiveChange } = renderCombobox();

    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('chloe'));
    expect(onActiveChange).toHaveBeenLastCalledWith('chloe');

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('chloe');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
  });

  it('picks with the mouse', async () => {
    const { user, input, onChange } = renderCombobox();

    await user.click(input);
    await user.click(screen.getByRole('option', { name: /James/ }));

    expect(onChange).toHaveBeenCalledWith('james');
  });

  it('closes with Escape and says when nothing matches', async () => {
    const { user, input } = renderCombobox();

    await user.type(input, 'zzz');
    expect(screen.getByText('No matches')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const { user, input } = renderCombobox();
    await user.click(input);
    await expectNoAxeViolations(document.body);
  });
});
