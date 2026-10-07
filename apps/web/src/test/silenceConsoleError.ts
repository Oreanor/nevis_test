import { vi } from 'vitest';

/** React logs caught render errors; silence them in tests that throw on purpose. Restored after each test. */
export function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}
