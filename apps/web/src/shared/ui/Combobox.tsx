import { clsx } from 'clsx';
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { filterOptions } from '../lib/filterOptions';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

export interface ComboboxOption {
  id: string;
  label: string;
  /** Secondary text, also searched (e.g. a branch name). */
  description?: string;
  /** Leading visual, e.g. an avatar; decorative. */
  icon?: ReactNode;
}

const POPUP_GAP = 4;
const POPUP_MAX_HEIGHT = 200;
const POPUP_MIN_HEIGHT = 120;

/**
 * Where the list goes: below the input, or above it when there is not enough room below. Fixed positioning in
 * a portal keeps it from being clipped by scrolling or overflow-hidden ancestors.
 */
function popupStyle(input: HTMLElement): CSSProperties {
  const rect = input.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - POPUP_GAP * 2;
  const above = rect.top - POPUP_GAP * 2;
  const openUp = below < POPUP_MIN_HEIGHT && above > below;
  return {
    left: rect.left,
    width: rect.width,
    maxHeight: Math.min(POPUP_MAX_HEIGHT, Math.max(openUp ? above : below, 0)),
    ...(openUp ? { bottom: window.innerHeight - rect.top + POPUP_GAP } : { top: rect.bottom + POPUP_GAP }),
  };
}

interface ComboboxProps {
  label: string;
  options: readonly ComboboxOption[];
  /** Id of the selected option, if any. */
  value: string | null;
  onChange: (id: string) => void;
  /** Option under the pointer or keyboard while the list is open, `null` when closed (e.g. to preview it). */
  onActiveChange?: (id: string | null) => void;
  placeholder?: string;
  /** Message when nothing matches the query. */
  emptyMessage?: string;
  className?: string;
}

/**
 * Searchable select following the WAI-ARIA combobox pattern (editable input + listbox popup): typing filters,
 * ↑/↓ move the active option, Enter picks it, Escape closes (and clears the query when already closed).
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  onActiveChange,
  placeholder,
  emptyMessage = 'No matches',
  className,
}: ComboboxProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.id === value) ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(() => filterOptions(options, query), [options, query]);
  const active = isOpen ? matches[Math.min(activeIndex, matches.length - 1)] : undefined;

  const [popup, setPopup] = useState<CSSProperties | null>(null);
  useLayoutEffect(() => {
    if (!isOpen) return;
    const place = () => {
      if (inputRef.current) setPopup(popupStyle(inputRef.current));
    };
    place();
    // Capture: also follow scrolling of any ancestor, not only the window.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [isOpen]);

  const reportActive = useEffectEvent((activeId: string | null) => onActiveChange?.(activeId));
  const activeId = active?.id ?? null;
  useEffect(() => {
    reportActive(activeId);
  }, [activeId]);

  const open = () => {
    setIsOpen(true);
    setActiveIndex(
      Math.max(
        0,
        matches.findIndex((o) => o.id === value),
      ),
    );
  };
  const close = () => {
    setIsOpen(false);
    setQuery('');
  };
  const pick = (option: ComboboxOption) => {
    onChange(option.id);
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) open();
        else setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (active) {
          event.preventDefault();
          pick(active);
        }
        break;
      case 'Escape':
        if (isOpen || query) {
          event.preventDefault();
          close();
        }
        break;
    }
  };

  return (
    <div className={clsx('relative flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-footnote text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={active ? `${id}-option-${active.id}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={isOpen ? query : (selected?.label ?? '')}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={open}
          onClick={open}
          onBlur={close}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md bg-page py-1.5 pr-8 pl-2.5 text-body text-ink placeholder:text-muted"
        />
        <ChevronRightIcon
          className={clsx(
            'pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted transition-transform motion-reduce:transition-none',
            isOpen ? '-rotate-90' : 'rotate-90',
          )}
        />
      </div>
      {isOpen &&
        popup &&
        createPortal(
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            style={popup}
            className="fixed z-50 overflow-y-auto rounded-md bg-surface p-1 shadow-lg ring-1 ring-line"
          >
            {matches.length === 0 && <li className="px-2 py-1.5 text-footnote text-muted">{emptyMessage}</li>}
            {matches.map((option) => (
              <li
                key={option.id}
                id={`${id}-option-${option.id}`}
                role="option"
                aria-selected={option.id === value}
                // Keep focus in the input: pick on mousedown, before the input's blur closes the list.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(option);
                }}
                onMouseEnter={() => setActiveIndex(matches.indexOf(option))}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-body',
                  option === active && 'bg-row-hover',
                  option.id === value && 'font-medium',
                )}
              >
                {option.icon}
                <span className="min-w-0 truncate">{option.label}</span>
                {option.description && (
                  <span className="ml-auto shrink-0 text-footnote text-muted">
                    <span className="sr-only">, </span>
                    {option.description}
                  </span>
                )}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
