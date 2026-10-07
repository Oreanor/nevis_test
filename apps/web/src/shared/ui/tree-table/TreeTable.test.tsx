import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '@/test/axe';

import { testAccessors, type TestNode, testTree } from './testTree';
import { TreeTable, type TreeTableProps } from './TreeTable';
import type { TreeTableColumn } from './types';

const columns: TreeTableColumn<TestNode>[] = [{ id: 'value', header: 'Value', cell: (node) => node.value }];

function renderTable(props: Partial<TreeTableProps<TestNode>> = {}) {
  const user = userEvent.setup();
  render(
    <TreeTable
      aria-label="Test tree"
      data={testTree}
      columns={columns}
      {...testAccessors}
      getRowLabel={(node) => node.name}
      renderRowHeader={(node) => node.name}
      {...props}
    />,
  );
  return { user, grid: screen.getByRole('treegrid', { name: 'Test tree' }) };
}

const row = (name: string) => screen.getByRole('row', { name: new RegExp(`^${name}\\b`) });
const bodyRowNames = (grid: HTMLElement) =>
  within(grid)
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent);

describe('TreeTable', () => {
  describe('expand and collapse with the mouse', () => {
    it('starts with the default expanded rows', () => {
      const { grid } = renderTable({ defaultExpandedIds: ['root'] });
      expect(bodyRowNames(grid)).toEqual(['Root', 'Branch A', 'Branch B']);
    });

    it('reveals and hides the level beneath when the toggle is clicked', async () => {
      const { user, grid } = renderTable({ defaultExpandedIds: ['root'] });

      await user.click(screen.getByRole('button', { name: 'Expand Branch A' }));
      expect(bodyRowNames(grid)).toEqual(['Root', 'Branch A', 'Leaf A1', 'Leaf A2', 'Branch B']);
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');

      await user.click(screen.getByRole('button', { name: 'Collapse Branch A' }));
      expect(bodyRowNames(grid)).toEqual(['Root', 'Branch A', 'Branch B']);
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'false');
    });

    it('collapsing an ancestor hides all its descendants and restores them on re-expand', async () => {
      const { user, grid } = renderTable({ defaultExpandedIds: ['root', 'a', 'a1'] });
      expect(bodyRowNames(grid)).toContain('Deep A1X');

      await user.click(screen.getByRole('button', { name: 'Collapse Root' }));
      expect(bodyRowNames(grid)).toEqual(['Root']);

      await user.click(screen.getByRole('button', { name: 'Expand Root' }));
      expect(bodyRowNames(grid)).toContain('Deep A1X');
    });

    it('toggles an expandable row when it is clicked anywhere', async () => {
      const { user, grid } = renderTable({ defaultExpandedIds: ['root'] });

      await user.click(within(row('Branch A')).getByRole('gridcell'));
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');
      expect(bodyRowNames(grid)).toContain('Leaf A1');

      await user.click(within(row('Branch A')).getByRole('rowheader'));
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'false');
      expect(row('Branch A')).toHaveAttribute('tabindex', '0');
    });

    it('toggles exactly once when the chevron itself is clicked', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root'] });

      await user.click(screen.getByRole('button', { name: 'Expand Branch A' }));
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');
    });

    it('ignores clicks on leaf rows', async () => {
      const { user, grid } = renderTable({ defaultExpandedIds: ['root'] });

      await user.click(within(row('Branch B')).getByRole('gridcell'));
      expect(bodyRowNames(grid)).toEqual(['Root', 'Branch A', 'Branch B']);
    });

    it('does not toggle when a click ends a text selection', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root'] });
      const cell = within(row('Branch A')).getByRole('gridcell');
      vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false } as Selection);

      await user.click(cell);
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders no toggle for leaf rows', () => {
      renderTable({ defaultExpandedIds: ['root'] });
      expect(within(row('Branch B')).queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('hierarchy exposed to assistive technology', () => {
    it('sets level, position, set size and expanded state on rows', () => {
      renderTable({ defaultExpandedIds: ['root', 'a'] });

      expect(row('Root')).toHaveAttribute('aria-level', '1');
      expect(row('Root')).toHaveAttribute('aria-expanded', 'true');
      expect(row('Leaf A2')).toHaveAttribute('aria-level', '3');
      expect(row('Leaf A2')).toHaveAttribute('aria-posinset', '2');
      expect(row('Leaf A2')).toHaveAttribute('aria-setsize', '2');
      expect(row('Leaf A1')).toHaveAttribute('aria-expanded', 'false');
    });

    it('omits aria-expanded on leaves', () => {
      renderTable({ defaultExpandedIds: ['root'] });
      expect(row('Branch B')).not.toHaveAttribute('aria-expanded');
    });

    it('labels the hierarchy column for screen readers', () => {
      const { grid } = renderTable({ rowHeaderLabel: 'Organisation' });
      expect(within(grid).getByRole('columnheader', { name: 'Organisation' })).toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    it('has a single tab stop on the first row', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root'] });

      await user.tab();
      expect(row('Root')).toHaveFocus();
      expect(row('Branch A')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByRole('button', { name: 'Collapse Root' })).toHaveAttribute('tabindex', '-1');
    });

    it('navigates, expands and collapses with arrow keys', async () => {
      const { user, grid } = renderTable({ defaultExpandedIds: ['root'] });
      await user.tab();

      await user.keyboard('{ArrowDown}');
      expect(row('Branch A')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');
      expect(row('Branch A')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(row('Leaf A1')).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(row('Branch A')).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'false');
      expect(bodyRowNames(grid)).toEqual(['Root', 'Branch A', 'Branch B']);
    });

    it('toggles with Enter and Space', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root'] });
      await user.tab();
      await user.keyboard('{ArrowDown}');

      await user.keyboard('{Enter}');
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');
      await user.keyboard(' ');
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'false');
    });

    it('jumps with Home and End', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root'] });
      await user.tab();

      await user.keyboard('{End}');
      expect(row('Branch B')).toHaveFocus();
      await user.keyboard('{Home}');
      expect(row('Root')).toHaveFocus();
    });

    it('keeps the tab stop on the focused row after moving', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root'] });
      await user.tab();
      await user.keyboard('{ArrowDown}');

      expect(row('Branch A')).toHaveAttribute('tabindex', '0');
      expect(row('Root')).toHaveAttribute('tabindex', '-1');
    });

    it('moves the tab stop to the visible ancestor when the active row gets hidden', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root', 'a'] });
      await user.tab();
      await user.keyboard('{ArrowDown}{ArrowDown}'); // Leaf A1

      await user.click(screen.getByRole('button', { name: 'Collapse Branch A' }));
      expect(row('Branch A')).toHaveAttribute('tabindex', '0');
    });
  });

  describe('controlled expansion', () => {
    it('reports changes and renders the expanded ids it is given', async () => {
      const onExpandedChange = vi.fn();
      function Controlled() {
        const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set(['root']));
        return (
          <TreeTable
            aria-label="Test tree"
            data={testTree}
            columns={columns}
            {...testAccessors}
            getRowLabel={(node) => node.name}
            renderRowHeader={(node) => node.name}
            expandedIds={expanded}
            onExpandedChange={(next) => {
              onExpandedChange(next);
              setExpanded(next);
            }}
          />
        );
      }
      const user = userEvent.setup();
      render(<Controlled />);

      await user.click(screen.getByRole('button', { name: 'Expand Branch A' }));

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(['root', 'a']));
      expect(row('Leaf A1')).toBeInTheDocument();
    });
  });

  it('renders value cells through the column definitions', () => {
    renderTable({ defaultExpandedIds: ['root'] });
    expect(within(row('Branch A')).getByRole('gridcell')).toHaveTextContent('60');
    expect(screen.getByRole('columnheader', { name: 'Value' })).toBeInTheDocument();
  });

  describe('axe', () => {
    it('has no violations when collapsed', async () => {
      renderTable();
      await expectNoAxeViolations(document.body);
    });

    it('has no violations when fully expanded with a focused row', async () => {
      const { user } = renderTable({ defaultExpandedIds: ['root', 'a', 'a1'] });
      await user.tab();
      await user.keyboard('{ArrowDown}');
      await expectNoAxeViolations(document.body);
    });
  });

  describe('selection', () => {
    function renderSelectable() {
      const onSelect = vi.fn();
      function Selectable() {
        const [selectedId, setSelectedId] = useState<string | null>('root');
        return (
          <TreeTable
            aria-label="Test tree"
            data={testTree}
            columns={columns}
            {...testAccessors}
            getRowLabel={(node) => node.name}
            renderRowHeader={(node) => node.name}
            defaultExpandedIds={['root']}
            selectedId={selectedId}
            onSelect={(id) => {
              onSelect(id);
              setSelectedId(id);
            }}
          />
        );
      }
      const user = userEvent.setup();
      render(<Selectable />);
      return { user, onSelect };
    }

    it('marks rows with children as selectable and leaves as not', () => {
      renderSelectable();
      expect(row('Root')).toHaveAttribute('aria-selected', 'true');
      expect(row('Branch A')).toHaveAttribute('aria-selected', 'false');
      expect(row('Branch B')).not.toHaveAttribute('aria-selected');
    });

    it('selects and expands a row on click', async () => {
      const { user, onSelect } = renderSelectable();

      await user.click(within(row('Branch A')).getByRole('gridcell'));

      expect(onSelect).toHaveBeenCalledWith('a');
      expect(row('Branch A')).toHaveAttribute('aria-selected', 'true');
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');
    });

    it('the chevron only toggles, without selecting', async () => {
      const { user, onSelect } = renderSelectable();

      await user.click(screen.getByRole('button', { name: 'Expand Branch A' }));

      expect(onSelect).not.toHaveBeenCalled();
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');
    });

    it('Enter selects, Space toggles', async () => {
      const { user, onSelect } = renderSelectable();
      await user.tab();
      await user.keyboard('{ArrowDown}');

      await user.keyboard(' ');
      expect(row('Branch A')).toHaveAttribute('aria-expanded', 'true');
      expect(onSelect).not.toHaveBeenCalled();

      await user.keyboard('{Enter}');
      expect(onSelect).toHaveBeenCalledWith('a');
    });
  });

  describe('extensions for linked views', () => {
    it('renders extra header rows above the column headers, sharing the columns', () => {
      const { grid } = renderTable({
        stickyHeader: true,
        headerRows: (
          <tr aria-hidden="true">
            <td>controls</td>
            <td>bar</td>
          </tr>
        ),
      });
      const headRows = grid.querySelectorAll('thead tr');
      expect([...headRows].map((r) => r.textContent)).toEqual(['controlsbar', 'NameValue']);
    });

    it('reports the hovered row, then the focused row, then none', async () => {
      const onActiveRowChange = vi.fn();
      const { user } = renderTable({ defaultExpandedIds: ['root'], onActiveRowChange });

      await user.hover(row('Branch A'));
      expect(onActiveRowChange).toHaveBeenLastCalledWith('a');

      await user.unhover(row('Branch A'));
      expect(onActiveRowChange).toHaveBeenLastCalledWith(null);

      await user.tab();
      expect(onActiveRowChange).toHaveBeenLastCalledWith('root');

      await user.tab();
      expect(onActiveRowChange).toHaveBeenLastCalledWith(null);
    });
  });
});
