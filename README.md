# Nevis – Clients dashboard

Thank you for the interesting assignment. This repository contains my solution to the Nevis frontend take-home:
a dashboard that shows how the book of business develops over twelve months, with a stacked bar chart and a
drill-down table (Company → Branch → Adviser → Acquisition channel).

The work is in two parts:

1. **`/` – Clients dashboard.** The brief implemented as specified, matching the Figma mockup as closely as I
   could measure it.
2. **`/explorer` – Clients explorer.** My own take on the same data: the version of the dashboard I would
   propose, built separately so the two can be compared. The explorer is linked from the dashboard header.

Everything that follows explains what was built, the decisions behind it, and the improvements I suggest.

## Contents

- [Requirements at a glance](#requirements-at-a-glance)
- [Run it](#run-it) · [Test and check](#test-and-check)
- [Part 1 – The dashboard, as specified](#part-1--the-dashboard-as-specified)
- [Part 2 – Clients explorer, my take](#part-2--clients-explorer-my-take)
- [Scrolling principles](#scrolling-principles)
- [How it is built](#how-it-is-built)
- [What I would do next](#what-i-would-do-next)
- [Further documents](#further-documents)

## Requirements at a glance

| Requirement from the brief                                          | How it is met                                                                                             |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Stacked bar chart of the data over time                             | Own SVG chart kit, 12 months, stacked by client type as in the mockup                                     |
| Table per month with expandable rows revealing the level beneath    | Generic `TreeTable`; Company → Branch → Adviser → Channel                                                 |
| Handle the non-uniform nesting                                      | Rows without children are leaves (no expand control); tested against the real payload                     |
| Start from an empty project                                         | npm workspaces: `apps/api`, `apps/web`, `packages/shared`                                                 |
| UI and behaviour closely match the design                           | Measured against Figma SVG exports: positions within 0.25px, colours exact ([details](docs/DESIGN.md))    |
| React and TypeScript                                                | React 19, TypeScript 6 (strict)                                                                           |
| Serve the data from a Node.js REST API                              | Express 5, `GET /api/clients`, payload served verbatim                                                    |
| Loading and error states in the UI                                  | Skeleton while loading; error with retry; malformed responses rejected at the boundary                    |
| Composable component APIs with clear boundaries                     | Domain-free `TreeTable` and chart kit (composable layers), one adapter for the payload, enforced layering |
| Expand/collapse from the keyboard                                   | WAI-ARIA treegrid: one tab stop, ↑ ↓ → ← Home End Enter Space                                             |
| Hierarchy reaches assistive technology                              | `aria-level`, `aria-posinset`, `aria-setsize`, `aria-expanded` only on rows with children                 |
| Tests: expand/collapse and data → chart                             | Mouse and keyboard expand/collapse, ARIA, data mapping, rendered segments; plus axe scans                 |
| Nothing breaks or overflows down to 375px                           | Checked at 375px on both pages: no page overflow; tables and charts scroll inside their cards             |
| Any CSS framework / charting / state library                        | Tailwind CSS v4; no chart library (own kit); TanStack Query for server state                              |
| Short README with run/test, assumptions, open questions, next steps | This document (longer than short, for the reasons above – sorry)                                          |

## Run it

Requires Node.js ≥ 22.

```bash
npm install
npm run dev        # API on http://localhost:3001, web on http://localhost:5173
```

Open http://localhost:5173 for the dashboard and http://localhost:5173/explorer for the explorer. The Vite dev
server proxies `/api` and `/avatars` to the API.

To see the loading and error states, slow the API down and/or make it fail:

```bash
API_DELAY_MS=1500 API_FAILURE_RATE=0.5 npm run dev            # bash
$env:API_DELAY_MS=1500; $env:API_FAILURE_RATE=0.5; npm run dev  # PowerShell
```

| Variable            | Where | Default                 | Purpose                                              |
| ------------------- | ----- | ----------------------- | ---------------------------------------------------- |
| `PORT`              | api   | `3001`                  | API port                                             |
| `API_DELAY_MS`      | api   | `0`                     | Artificial latency on `/api/*`                       |
| `API_FAILURE_RATE`  | api   | `0`                     | Probability (0..1) that an `/api/*` call returns 500 |
| `API_URL`           | web   | `http://localhost:3001` | Proxy target for the dev/preview server              |
| `VITE_API_BASE_URL` | web   | _(same origin)_         | API origin when the web app is deployed separately   |

Production-like run: `npm run build` bundles the API (tsdown → `apps/api/dist/server.js`) and the web app
(Vite). Then `npm start` runs the API on plain Node, and `npm run preview -w @nevis/web` serves the web build.

**Deploying to Vercel.** `vercel.json` builds both apps, serves the web build as static files and runs the
same Express app as a serverless function (`api/index.mjs` → `apps/api/dist/handler.js`) for `/api/*` and
`/avatars/*`; every other path falls back to `index.html`, so `/explorer` works as a direct link. Import the
repository in Vercel with the default settings; no environment variables are needed.

## Test and check

```bash
npm test             # API (supertest) + web (Vitest, Testing Library, jsdom)
npm run typecheck
npm run lint
npm run format:check
npm run knip         # dead code: unused files, exports and dependencies
npm run check        # all of the above + tests (what CI runs)
```

What is covered (around 200 tests):

- **Expand and collapse** with the mouse and the keyboard, the single tab stop, and the focus fallback when the
  focused row is hidden by collapsing an ancestor.
- **Hierarchy for assistive technology**: level, position, set size, and expanded state only on parents.
- **Data → chart**: the per-month, per-series mapping; the rendered SVG segments carry the mapped values; the
  chart's accessible totals equal the Company row. Scales, ticks and stacking have unit tests.
- **Loading, error, retry and malformed responses**, the HTTP client's error kinds, the retry policy, the error
  boundary and the avatar fallback.
- **axe-core scans** of the table, the chart, the dashboard in every state, the explorer and whole pages through
  the router. (Colour contrast cannot be computed in jsdom; it was checked with a palette validator instead.)
- **Explorer**: the pivot model, the colour model, selection and re-scoping, highlighting, the tooltip, the
  adviser search, and the URL state.
- **API**: both datasets validate against the shared schema, irregular nesting is preserved, avatars are
  served, invalid input returns 400, and errors never leak internal details.

## Part 1 – The dashboard, as specified

The dashboard at `/` follows the brief and the mockup:

- The **chart** stacks the company total by client type (Existing clients, New organic, New paid), with the
  mockup's colours, dotted grid, 4px-rounded bars and legend.
- The **table** shows the twelve months with Company expanded and branches collapsed, as in the mockup. Rows
  expand on a click anywhere in the row, on the chevron, or with the keyboard.
- **Fidelity:** I measured the page against the SVG exports of the Figma frames rather than against screenshots.
  Card and grid positions match within 0.25px, column widths (92px) and row heights (56px) exactly, and the
  colours are the exported values. The remaining sub-pixel differences come from text rendering.
- **Avatars** are the photos from the design, served by our API and downscaled to 64×64 (about 11 KB each); the
  UI falls back to initials if an image is missing.
- **One addition to the mockup:** a small "Open the clients explorer" link next to the page title.
- **Phones** get a compact layout: smaller title and spacing, all twelve months visible in the chart without
  scrolling, and a denser table that scrolls horizontally with a pinned name column.

**Decisions** where the brief or the design left room for interpretation:

- **Chart split by client type.** Only one adviser has a client-type breakdown in the data, so "New organic" and
  "New paid" are the sums of the channel rows that exist, and "Existing clients" is the rest of the company
  total. Each bar therefore matches the Company row in the table.
- **No expand arrow on rows without children** (Branch 2 and Branch 3): an arrow that reveals nothing is
  confusing, and screen readers would announce a row that cannot be expanded.
- **Data shown exactly as received.** Where a parent differs from the sum of its children (for example Company
  in May 2024), or where the mockup shows a different figure, the API payload is the source of truth.
- **Reporting period** February 2024 – January 2025, as stated in the brief; the values carry no dates.

## Part 2 – Clients explorer, my take

The mockup is a clean starting point, and I would like to respectfully suggest a few improvements to how the
data is presented. The explorer at `/explorer` implements them on the same visual language (tokens, type,
spacing), so the two pages can be compared side by side. The full reasoning, written for a non-technical
reader, is in [`docs/IMPROVEMENTS.md`](docs/IMPROVEMENTS.md).

**A note on where these ideas come from.** As the brief allows, I used AI tools to help with parts of the
implementation. The design direction of the explorer, however, is my own: what to show, how to connect the
chart and the table, and how people should move through the data. It draws on about seven years of work in
infographics and data visualisation, where I learned the principles of clear, usable data design that I have
tried to apply here. This is the part of the work I deliberately did not hand over to AI.

**What I saw as opportunities in the original layout**

- The chart and the table sit in separate cards with different horizontal geometry, so a bar is not above
  its month's figures, and the month labels appear twice.
- The chart shows a split the data cannot support, and it does not follow the drill-down in the table.
- The sample data is too shallow to show a drill-down (two of three branches have no advisers).

**What the explorer does**

- **One grid.** The chart is the top part of the table: every bar sits directly above its month's figures,
  months are labelled once, and chart and table scroll and shrink together.
- **Break down by branch, adviser or client type.** The table regroups accordingly (branch → adviser → type,
  type → branch → adviser, adviser → type), and the chart follows.
- **Click a row with children to focus the chart on it.** The chart then shows that row split by its children;
  a breadcrumb leads back. The view is kept in the URL, so it can be shared and the Back button works.
- **Linked highlighting.** Hovering or focusing a row highlights it in the chart (a row deeper than the chart's
  level is marked as its share of the containing segment). Hovering a month shows a tooltip with every value
  and highlights the month in the table; hovering a segment or a legend entry highlights its row.
- **A legend that names its categories** (Branches, Advisers, Client types). When the data is broken down by
  adviser, an adviser search stays in the panel: it lists every adviser with their colour and branch (so it
  doubles as the legend), previews the highlighted one in the chart, and focuses the chart on the one you pick.
  It keeps the chosen name, so you can switch advisers directly; the client-type legend appears below it.
- **Colours that belong to the entity.** Branch 2 has the same colour in every view; advisers use shades of
  their branch's colour, so the branch structure stays visible even with many advisers. The palettes were
  checked with a validator for colour-blind safety and contrast, and muddy colours (dark oranges and
  yellows, which turn brown) were left out.
- **Richer, consistent demo data.** The explorer uses a second dataset from the same API
  (`GET /api/clients?dataset=extended`) in which every branch has advisers and every adviser has a client-type
  split. It is generated deterministically (`npm run generate:extended -w @nevis/api`), keeps the brief's
  advisers and branch totals, and every parent equals the sum of its children, so all breakdowns agree.
  As a result, a few totals differ from the brief (for example, Company in May 2024 is 279 rather than 301).
  The original payload is untouched and still powers the dashboard.

## Scrolling principles

Both pages follow the same rule: **the page itself never scrolls sideways; wide content scrolls inside its own
card, and the parts you need for orientation stay in place.**

- **Horizontal scrolling happens inside the card.** When the twelve months do not fit, the table (and, on the
  explorer, the chart together with it) scrolls horizontally within its card. The name column stays pinned on
  the left, so you always know which row a figure belongs to.
- **Dashboard.** The page scrolls vertically as a normal document. On phones the chart shows all twelve months
  without scrolling, and the table scrolls sideways under its pinned names.
- **Explorer: one screen, fixed header.** On screens at least 640px wide and 480px tall, the explorer fills
  exactly one screen. The chart and the month row form a fixed header in the top half of the explorer card,
  and **only the data rows scroll** underneath it. This keeps the chart in view while you work in the table,
  which is what makes selection and highlighting useful. The chart is never taller than 420px (on a large
  monitor half the screen would make the bars needlessly tall) and never shorter than 128px.
- **Explorer on small screens.** Below those sizes the page scrolls normally instead: a scroll area inside a
  scrolling page is awkward on touch screens. The controls move above the table, and the name column stays
  pinned.
- **Scrolling to a choice.** Picking an adviser in the adviser search scrolls the table so that the row lands
  just below the fixed header.

## How it is built

Implementation notes are in [`docs/PLAN.md`](docs/PLAN.md); conventions for contributors and coding agents in
[`AGENTS.md`](AGENTS.md).

- **Layers**: `app → pages → features → shared`, enforced by ESLint. Each feature owns its data fetching, its
  pure domain model and its UI; the tree table, the chart kit and the combobox are domain-free and live in
  `shared/ui`.
- **One adapter**: the payload's per-level keys (`branches`/`employees`/`channels`) are mapped in one place; the
  explorer flattens the same payload into facts and builds its hierarchies with a pure pivot function.
- **`TreeTable`** is generic: rows, columns and the hierarchy column's content come from the caller; expansion
  can be controlled or uncontrolled; it supports selection, highlighting, extra header rows and a sticky header,
  and follows the WAI-ARIA treegrid pattern.
- **Chart kit**: written from scratch for maximum flexibility. The dashboard composes layers (`GridLines`,
  `YAxis`, `XAxis`, `StackedBars`, `ChartLegend`, `ChartDataTable`) inside `ChartRoot`; the explorer draws one
  `ColumnStack` per table cell on a shared scale, so bars align with the columns by construction.
- **API**: thin routers, services and repositories, wired in one composition root; `createApp` receives its
  dependencies, so tests inject fakes. The environment is validated at startup.
- **Errors**: responses are validated against the shared schema and surface as a typed `ApiError`; retries
  only happen when they can help; widgets have their own error boundaries.
- **Quality gates**: typecheck, lint (including the layering rules), formatting, dead-code detection (knip) and
  all tests run in CI (GitHub Actions, Node 22 and 24), together with both production builds.

## What I would do next

- **Show change, not only levels.** A change column (absolute and %) and a small trend per row, since "are we
  growing?" is the first question a manager asks.
- **Absolute vs share.** A switch to show each row as a share of its parent, with a 100% chart.
- **Sorting and search in the table**, and pinning two or three rows to compare them as lines over the chart.
- **Keyboard access to the chart columns**, with the same tooltip on focus.
- **Data-quality hints** on the brief's data: mark cells where a parent differs from the sum of its children.
- **Testing**: Playwright smoke tests in a real browser (with axe, including colour contrast), visual regression
  for the design match, and a manual pass with NVDA and VoiceOver.
- **API**: an OpenAPI description generated from the zod schema, caching headers, and the reporting period in the
  response.

## Further documents

- [`docs/IMPROVEMENTS.md`](docs/IMPROVEMENTS.md) – the explorer proposal, written for the client
- [`docs/DESIGN.md`](docs/DESIGN.md) – the visual spec measured from Figma, and the explorer's layout
- [`docs/PLAN.md`](docs/PLAN.md) – architecture, decisions and the task list
- [`AGENTS.md`](AGENTS.md) – conventions for contributors and coding agents
