# Design spec (extracted from Figma)

Source: Figma "Web engineer home task", page **Mockups**, frame **Mockup 2**
(`https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=1-2781`).
Agents without Figma access should treat this file as the source of truth for the main page.

## Layout

- Page frame: 1440 × 900 design width, background `#F7F5ED` (token `Background/Primary`), padding 16px horizontal, 24px
  vertical (title text box starts 24px from the top; cards at y 84 and 530 in `Content.svg`).
- Title "Clients" top-left (Title text style), then two white cards stacked vertically, gap 16px:
  1. **Chart card** – white (`Background/Secondary` `#FFFFFF`), radius 8px.
  2. **Table card** – white, radius 8px, width fills the frame (1408px at 1440).
- Text styles (Figma): `Title 35/125`, `Body 14/20`, `Footnote 12/16`. Font is Inter-like sans-serif.
  Use Inter (self-hosted via `@fontsource-variable/inter`) with system fallback.
- Colours from the Figma SVG exports (`Content.svg`, `State=Opened.svg`, `Table · Third level.svg`):
  | Use                                          | Value                    |
  | -------------------------------------------- | ------------------------ |
  | Text, chevrons                               | `#141413`                |
  | Secondary text (axis labels, header, legend) | `#141413` at 60% opacity |
  | Chart grid lines                             | `#141413` at 16% opacity |
  | Row dividers                                 | `#141413` at 8% opacity  |

## Chart

- Stacked vertical bar chart, one bar per month, 12 months **Feb 2024 … Jan 2025**.
- Series (bottom → top) and colors:
  | Series           | Color     |
  | ---------------- | --------- |
  | Existing clients | `#B29DF8` |
  | New organic      | `#F4BEB4` |
  | New paid         | `#A75E6E` |
- Y axis: 0–400, ticks every 100, grey 12px labels ending ~12px left of the plot with their baseline
  2px below the grid line; grid lines are 1px dots (`stroke-dasharray="1 6"`, round caps); no axis lines.
- X axis: month labels `MMM YYYY` (12px grey), centred 20px below the baseline, no axis line.
- Each whole bar (stack) is clipped to a rectangle with a 4px radius on all four corners; segments are plain
  rectangles inside it. Legend swatches have a 2px radius; cards 8px.
- Legend centred under the chart: 8px square swatch, 4px gap, 12px grey label; 16px between items.
- Measured geometry at 1440, relative to the 1408 × 430 chart card (checked against a 100% Figma capture):

  | Element       | Value                                |
  | ------------- | ------------------------------------ |
  | Plot area     | x 54 → 1392, y 34 (400) → 354 (0)    |
  | Bars          | 87.5 wide, 111.5 step, first at x 66 |
  | Legend centre | y 406                                |

- The chart in the prototype is **static** – expanding table rows does not change it.

## Table

- Header row: empty first cell, then month labels (`Feb 2024` …), secondary text, right-aligned; the labels
  sit 2px below the row centre (body rows are centred).
- Header and body rows: 56px high, 1px divider between rows.
- Columns at 1440 (1408 table): 12 month columns of exactly 92px with the figure 24px from the column's right
  edge; the hierarchy column takes the rest (304px).
- Chevron: 7 × 3.5px, 1.5px stroke, square caps, centred 24px from the card edge; the name starts at 40px.
- Numeric cells right-aligned, tabular numbers, primary text colour.
- First column ("Row name") contains, left to right: indentation per level, chevron (› collapsed / ⌄ expanded),
  optional avatar (employees only, 20px circle), name.
- Indentation: 28px per level (Company 0, Branch 1, Employee 2, Channel 3).
- Channel rows (third level, attributes) have **no chevron**; the name aligns where the avatar+name would be.
- Row states (Figma component "Row"): default, hover (light grey bg ≈ `#F2F2F2`), expanded, expanded+hover.
- Initial state in the mockup: Company expanded, branches collapsed.

## Behaviour observed in the prototype

- Clicking a chevron expands/collapses the row, revealing the level beneath.
- Expanding Branch 1 shows its 5 employees; expanding Anna Blackwood shows 3 channels.
- Branch 2 / Branch 3 show a chevron in Figma but have no children – **we render them as leaves (no chevron)**,
  see README assumptions.

## Known design vs data differences (do NOT "fix" data to match design)

- Figma table variant shows Branch 1 Jul 2024 = 291 and Robert Chen Aug 2024 = 56; API data says 201 and 58.
  The API payload is the source of truth.
- Chart bar heights in Figma are illustrative (Jan 2025 ≈ 363 while the data says 350).

## Clients explorer (`/explorer`) – our own layout, not in Figma

Same tokens and type as the dashboard. Rationale: [`IMPROVEMENTS.md`](IMPROVEMENTS.md).

- One card holding a tree table whose `<thead>` is: the chart row (one stacked bar per month cell, bar = the
  cell's content box, so its right edge lines up with the figures) and the month header row.
- From `fit` (≥ 640px wide, ≥ 480px tall): the page is exactly one screen; the header is sticky and takes half of
  the explorer card (a size container): chart `clamp(128px, 50cqh − 56px, 420px)`. Below that the page scrolls
  normally and the chart is 240px.
- Top-left corner (≥ `sm`, hierarchy column at least 320px): breadcrumb, "Break down by" native select, and the
  legend titled with what the colours stand for ("Branches", "Advisers", "Client types"; a hint line instead of
  a list above 6 series). The panel has 20px padding from the card edges and keeps 24px clear of the y-axis,
  which sits at the right edge of the corner cell. Below `sm` the controls stack above the table (16px padding)
  and the legend wraps in a row.
- Selected row: `#f0f0ef` background with a 3px ink bar on the leading edge. Rows of the current chart series show
  an 8px swatch before the name. Hover/linked highlight uses the row-hover colour.
- Chart: dotted grid (`#141413` @ 16%), bars rounded 4px by clipping, dimmed series at 25% opacity, a deeper row's
  share drawn as an ink-outlined band inside its segment. Tooltip: white, ring + shadow, values and total.
- Colours: `apps/web/src/features/client-explorer/model/palette.ts` (validated; do not edit by eye): 7 clean branch
  families (no oranges/yellows – their dark shades turn brown), 8 adviser shades each.
- Legend entries are hover targets: they highlight their series in the chart and their row in the table.
