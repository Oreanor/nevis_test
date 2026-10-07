# Clients explorer – proposed improvements

The main page (`/`) implements the brief and the Figma mockup as given. This document proposes a second
page, **Clients explorer** (`/explorer`), that keeps the same visual language but fixes problems we see in
the original layout and turns the dashboard into a drill-down tool. Both pages stay in the app so they can be
compared side by side.

Status: implemented at `/explorer` (linked from the dashboard). Implementation notes are in
[`PLAN.md`](PLAN.md) (Phase 8).

## What is wrong with the original layout

1. **Chart and table are not connected.** They sit in two cards with different horizontal geometry, so a
   bar is not above its month's numbers. The eye cannot travel from a bar to the figures behind it.
2. **Month labels appear twice** – under the chart and in the table header. That is noise, and it takes
   vertical space.
3. **The chart shows a breakdown the data cannot support.** It splits the company by client type, but only
   one adviser has client-type data. The rest of the dataset can only be shown as "existing clients".
4. **The chart is static.** Expanding a branch in the table does not change what the chart shows, so the
   "drill from company to branch to adviser" goal of the brief is only half met.
5. **The sample data is too shallow to evaluate a drill-down**: two of three branches have no advisers, and
   only one adviser has client types.

## Proposal

### 1. One grid for chart and table

The chart becomes the top part of the table: every bar sits exactly above its month column.

- One shared column layout: a hierarchy column on the left and one column per month.
- Month labels are shown **once**, in a single header row between the bars and the figures.
- Chart and table scroll horizontally **together** and shrink **together** when the window narrows. The
  left column stays pinned while scrolling.
- No gap between the chart and the table, so they read as one instrument.
- **Everything fits one screen.** The chart and the month row form a fixed header in the top part of the
  screen; only the data rows scroll underneath it. The chart therefore stays visible while you scroll, which is
  what makes row selection and hover highlighting (below) useful.
  - The fixed header (chart and month row) takes the top half of the explorer card and the table the bottom
    half, whatever the window height. The chart is never taller than 420px (on a large monitor half the
    screen would make the bars needlessly tall) and never shorter than 128px, so it stays readable.
  - Below 480px of height (and on phones) the page scrolls normally instead. A scroll area inside a page is
    awkward on touch screens. The pinned left column still works there.

### 2. A control column next to the chart

The space above the hierarchy column (which is empty in the original) holds the chart's controls:

- **"Break down by"**: Branch · Adviser · Client type.
- The **colour legend** for the current breakdown. Every breakdown has its own legend, and colours are
  stable: Branch 2 has the same colour wherever it appears. When the chart is split by adviser there are too
  many colours for a list, so the legend becomes one line instead: _each colour is an adviser – hover a
  segment or the adviser's row to see who_.
- The y-axis labels, pinned with the column so they stay visible while scrolling.

### 3. The table follows the chosen breakdown

The same data, regrouped (pivoted) for each breakdown. A **Total** row on top always shows the company figure.

| Break down by | Table hierarchy                          |
| ------------- | ---------------------------------------- |
| Branch        | Branch → Adviser → Client type           |
| Client type   | Client type → Branch → Adviser           |
| Adviser       | Adviser (with branch name) → Client type |

For "Adviser" we only expand into client types: going back up to branches would just repeat the adviser's
own branch. The branch is shown as a secondary label next to the adviser's name.

### 4. Click a row to re-focus the chart

One simple rule: **the chart always shows the selected row, split by its children.**

- Initially the selected row is Total, so the chart shows the company split by the chosen breakdown.
- Clicking a row that has children (for example, Branch 1) makes it the selection. The chart re-scales to
  that branch, split by its advisers, and the legend switches to those advisers.
- A breadcrumb above the chart (Total › Branch 1 › Anna Blackwood) shows the scope and lets the user jump
  back up.
- The selected row is highlighted in the table and announced to screen readers.

### 5. Hover a leaf row to see it in the chart

- Rows without children (for example, an adviser's "New paid" figures) are highlighted in the chart on hover
  and keyboard focus. Other segments fade; the row's own figures are right there in the table.
- If the row is not a segment of the current chart (it belongs to a deeper level), the chart highlights the
  segment that contains it and marks the row's share inside that segment.
- It also works the other way: hovering a month in the chart opens a small popover with every value of
  that month and the total, and highlights the month's column in the table; hovering a bar segment also
  highlights its row. The whole month column reacts to the pointer, because some segments are only a pixel
  or two tall.
- Hovering a legend entry highlights that series in the chart and its row in the table.
- Clicking a bar segment selects its row, as clicking the row itself does (a row without children is scrolled
  into view instead).
- Wherever the chart splits by adviser (the adviser breakdown, or a single branch), an adviser search replaces
  the legend: it lists those advisers with their colour (and branch where needed), previews the one under the pointer or keyboard in the chart, and focuses the chart on the one you
  pick (the table scrolls to that row). The chosen name stays in the field, so switching advisers is one step.

### 6. Richer demo data

A second dataset, served by the same API, where every branch has advisers and every adviser has a
client-type split:

- 3 branches with 3–5 advisers each, all with Existing / New organic / New paid figures.
- Branch 1 keeps the brief's advisers and their monthly totals. New advisers and the client-type splits are
  generated deterministically (seeded), so the numbers never change between runs.
- Every total equals the sum of its parts, so all three breakdowns agree with each other.
- The original payload stays untouched and keeps powering the main page.

## Colours

The chart colours were checked with a validator for colour-blind safety and contrast. Two client-type
colours of the mockup ("New organic", "New paid") were too light or too grey to be told apart reliably, so the
explorer keeps their hues and adjusts lightness and saturation. Branches get seven clean colour families spread
around the colour wheel (blue, crimson, purple, aqua, violet, lime, magenta); muddy oranges and yellows are
left out, because their dark shades turn brown. Each family has eight adviser shades, alternating dark and
light so neighbours in a bar stay distinct. Every neighbouring pair passes the validator even with all 56
shades in one bar. The main page keeps the mockup's colours exactly.

## Things we deliberately keep

- Same tokens, typography, colours and spacing as the mockup.
- Keyboard and screen-reader support: the hierarchy stays a treegrid, selection is announced, and every
  hover interaction also works with keyboard focus.
- Down to 375px nothing overflows. On phones the controls move above the grid, and the pinned column only
  keeps the names and y-axis.

## Decisions

1. **Many advisers in one chart.** All advisers are shown. Instead of a long legend, one line explains that
   each colour is an adviser; hovering a segment or a row reveals the name and figures.
2. **Clicking a row with children** selects it (the chart re-focuses on it) and expands it. The chevron
   only expands or collapses, without changing the chart. Keyboard: Enter selects, Space expands or collapses,
   arrow keys work as before.
3. **Avatars for the new advisers** fall back to initials.
