import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from './axe';

describe('expectNoAxeViolations', () => {
  it('passes accessible markup', async () => {
    render(<button type="button">Save</button>);
    await expectNoAxeViolations(document.body);
  });

  it('fails with a readable report on violations', async () => {
    render(
      <table role="treegrid" aria-label="Broken">
        <tbody>
          <tr aria-level={0}>
            <td role="gridcell">
              <button type="button" />
            </td>
          </tr>
        </tbody>
      </table>,
    );

    await expect(expectNoAxeViolations(document.body)).rejects.toThrow(/button-name/);
  });
});
