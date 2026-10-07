# Implementation plan

> Living task list for any agent (Claude Code, Codex, Cursor) or human working on this repo.
> Read `AGENTS.md` first for conventions, and `docs/DESIGN.md` for the visual spec.
> When you finish a task: tick its checkbox, add a one-line note under it if you diverged from the plan.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Goal

Dashboard "Clients" for Nevis advisors/managers (see `docs/Nevis Frontend Home Assignment.pdf`):

1. Stacked bar chart of client numbers over 12 months (Feb 2024 – Jan 2025).
2. Tree table with monthly detail; expandable rows Company → Branch → Employee → Channel.

Data is served by a Node.js REST API; UI handles loading and error states; accessible, tested,
no overflow down to 375px. The codebase is meant to grow into a full app (more pages, more features),
so structure and boundaries matter more than shortcuts.

## Architecture

```
.
├── apps/
│   ├── api/                      Express 5 REST API
│   │   ├── public/avatars/       Avatar images served at /avatars
│   │   └── src/
│   │       ├── app.ts            createApp(deps) – HTTP app from injected dependencies (testable, no listen)
│   │       ├── composition.ts    composition root – picks concrete implementations
│   │       ├── server.ts         listen + graceful shutdown (bundled by tsdown → dist/server.js)
│   │       ├── config.ts         env → typed AppConfig
│   │       ├── http/             errors (HttpError, 404, error handler), simulateNetwork (dev aid)
│   │       └── modules/          avatars/ (catalog + static router), clients/ (router → service → repository)
│   └── web/                      Vite + React 19 + Tailwind v4 + TanStack Query + React Router
│       └── src/
│           ├── app/              App, providers, router (lazy routes), RootLayout, RouteErrorPage, queryClient
│           ├── pages/            route components: clients/ClientsPage, not-found/NotFoundPage
│           ├── features/clients/ api/ (fetch + query options) · model/ (pure domain logic) · ui/ · index.ts
│           ├── shared/           api/httpClient · config/env · lib/ · ui/ (Card, Avatar, ErrorState,
│           │                     ErrorBoundary, Skeleton, icons/, chart/ kit, tree-table/)
│           └── test/             setup + helpers
├── packages/shared/              zod schema + types of the API contract, reporting period constants
├── docs/                         brief (PDF), PLAN.md, DESIGN.md
└── AGENTS.md / CLAUDE.md         conventions for agents
```

Layering rule (web, enforced by ESLint): `app → pages → features → shared`. Lower layers never import from higher ones;
features expose a public API through their `index.ts`.

npm workspaces, single `npm install` at the root. TypeScript 6.0 (typescript-eslint does not support TS 7 yet).
ESLint 9 (eslint-plugin-jsx-a11y does not support ESLint 10 yet).

### Data flow

```
GET /api/clients (payload verbatim + avatarUrl on employees)
  → getJson(path, companySchema)      shared/api/httpClient – typed ApiError: network | http | invalid-response
  → clientTreeQueryOptions()          TanStack Query; select: toClientTree → ClientNode tree
  → <ClientsDashboard>                skeleton / error with retry / chart + table (each in an ErrorBoundary)
      → <ClientsChart>                toClientTypeChartData(root, months) → chart kit
      → <ClientsTable>                generic <TreeTable> with month columns
```

The payload's per-level keys (`branches`, `employees`, `channels`) are adapted **once** in
`features/clients/model/clientTree.ts`; everything else works with the uniform `ClientNode`.

### Chart mapping decision (main page, matches Figma)

The design stacks the whole company by client type (Existing clients / New organic / New paid), while
channel data exists only for Anna Blackwood. `computeClientTypeTotals(root)`:

- `organic`, `paid` = sum of channel rows named "New organic" / "New paid" anywhere below `root`.
- `existing` = `root` total − organic − paid, so each bar equals the table figure. Employees without a
  channel breakdown therefore count as existing clients.

One pure function, unit tested, easy to replace.

### Chart kit (`shared/ui/chart`, no chart library)

Composable via context; every layer can be omitted, restyled or replaced, and `useChart()` gives custom
layers access to scales and stacked data:

```tsx
<ChartRoot data={data} series={series} height={380} minWidth={900} margin={...} bandPadding={0.21}>
  <ChartCanvas>                      {/* svg, aria-hidden, scrolls horizontally below minWidth */}
    <GridLines />
    <YAxis tickFormat={formatInteger} />
    <XAxis />
    <StackedBars radius={2} getSegmentProps? renderSegment? />
  </ChartCanvas>
  <ChartLegend />
  <ChartDataTable caption="…" />     {/* sr-only text alternative */}
</ChartRoot>
```

Pure helpers: `linearScale`, `bandScale`, `niceTicks`, `stackData`, `maxStackTotal`, `segmentPath`.
Colours come from the consumer (`ChartSeries.color`, CSS variables allowed).

### Avatars (assumption)

The design shows employee photos but the payload has none. The API serves images from
`apps/api/public/avatars/<employeeId>.<ext>` at `/avatars/…` and adds `avatarUrl` to employees that have
a file. The photos come from the Figma design, downscaled to 64×64 PNG (~11 KB; 20px × 3 for dense screens).
One file per employee: two files with the same id (e.g. `.svg` and `.png`) fail at startup.
UI falls back to initials on missing URL or load error. Avatars are decorative (name is next to them).

### Accessibility model

- `TreeTable` follows the WAI-ARIA **treegrid** pattern (row-focus mode): rows carry `aria-level`,
  `aria-posinset`, `aria-setsize`, and `aria-expanded` only when expandable.
- One tab stop (roving tabindex). ↑/↓ move, → expand / first child, ← collapse / parent, Home/End,
  Enter/Space toggle. If the active row is hidden by collapsing an ancestor, the tab stop moves to it.
- Clicking anywhere on an expandable row toggles it (clicks on interactive descendants and text selections
  are ignored). The chevron is also a `<button aria-label="Expand Branch 1">` (`tabIndex=-1`) so the
  control is named for screen-reader browse mode.
- Chart SVG is `aria-hidden`; a visually hidden data table (per series + totals) is the text alternative.
- Each card is a labelled `<section>`; loading state uses `role="status"`, errors `role="alert"`.

## Tasks

### Phase 0 – Planning

- [x] T0.1 Read brief + Figma, write `docs/DESIGN.md`, `docs/PLAN.md`, `AGENTS.md`.

### Phase 1 – Tooling & scaffolding

- [x] T1.1 Root `package.json` with npm workspaces, scripts: `dev`, `build`, `start`, `test`, `lint`, `typecheck`, `format`.
  - `overrides.shell-quote` pins a patched version (critical advisory via `concurrently`).
- [x] T1.2 Shared `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
- [x] T1.3 ESLint flat config (typescript-eslint strict, react-hooks, react-refresh, jsx-a11y) + Prettier
      (with Tailwind class sorting) + `.editorconfig`, `.gitattributes`, `.gitignore`.
- [x] T1.4 `packages/shared`: zod schema for the payload, inferred types, `PERIOD_START`, `MONTH_COUNT`.

### Phase 2 – API (`apps/api`)

- [x] T2.1 `createApp(config)` factory, JSON errors. No CORS: the web app reaches the API via the Vite proxy
      (same origin); `VITE_API_BASE_URL` exists for deployments on another origin (would need CORS then).
- [x] T2.2 `GET /api/clients` → payload from `modules/clients/data/clients.json`, validated at startup.
- [x] T2.3 `GET /api/health`; 404 + error middleware returning `{ error: { message } }`.
- [x] T2.3a Avatars served by the API + `avatarUrl` enrichment.
- [x] T2.4 Dev knobs to demo UI states: env `API_DELAY_MS`, `API_FAILURE_RATE` (0..1).
- [x] T2.5 Tests (vitest + supertest): schema-valid payload, irregular nesting kept, avatars served, 404, forced 500.

### Phase 3 – Web foundation (`apps/web`)

- [x] T3.1 Vite + React + TS + Tailwind v4, Figma tokens in `@theme` (`src/index.css`), Inter self-hosted.
- [x] T3.2 Vite proxy `/api` and `/avatars` → `API_URL` (default `http://localhost:3001`).
- [x] T3.3 `getJson` with zod validation + typed `ApiError`; query client with retry policy (no retry on 4xx/invalid data).
- [x] T3.4 App shell: React Router with lazy routes, `RouteErrorPage`, `NotFoundPage`, `AppProviders`.
- [x] T3.5 Domain: `toClientTree`, `findNodes`, `buildMonthColumns`, `computeClientTypeTotals` + unit tests.
- [x] T3.6 Test setup: vitest + jsdom + Testing Library + jest-dom.

### Phase 4 – UI components

- [x] T4.1 Primitives: `Card`, `Skeleton`, `ErrorState`, `ErrorBoundary`, `Avatar`, `ChevronRightIcon`.
- [x] T4.2 Chart kit (`shared/ui/chart`) + `ClientsChart`.
- [x] T4.3 `TreeTable` (generic) with `useTreeExpansion` (controlled/uncontrolled) and treegrid keyboard support.
- [x] T4.4 `ClientRowName` (avatar for employees), `ClientsTable`, `ClientsDashboardSkeleton`, `ClientsDashboard`.

### Phase 5 – Tests (web)

- [x] T5.1 Expand/collapse via mouse, including nested collapse/re-expand and leaves without toggles.
- [x] T5.2 Keyboard: ↑/↓/→/←/Home/End/Enter/Space, single tab stop, tab stop fallback when a row gets hidden.
- [x] T5.3 Hierarchy reaches AT: `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` only on parents.
- [x] T5.4 Chart: data mapping per month/series, rendered segments carry mapped values, accessible totals
      equal the company row; scales/stack/geometry unit tests.
- [x] T5.5 Dashboard: loading → data, server error → retry → data, malformed payload → error.
- [x] T5.6 HTTP client error kinds, retry policy, Avatar fallback, ErrorBoundary.
- [x] T5.7 axe-core scans (`src/test/axe.ts` helper, self-tested): TreeTable states, chart, dashboard
      loading/error/loaded, full pages via the router. Contrast is skipped in jsdom.

### Phase 6 – Responsiveness & polish

- [x] T6.1 375px: page never overflows; table and chart scroll inside their cards; sticky name column.
  - Found and fixed: an `sr-only` `<table>` cannot shrink and caused page overflow → wrapper div carries `sr-only`.
- [x] T6.2 Focus ring and hover drawn on cells (Chrome paints `<tr>` backgrounds per cell → seams at fractional
      widths, and ignores `<tr>` outlines); `motion-reduce` respected.
- [x] T6.3 Manual check in Chrome at 1536 and 375 px.
- [x] T6.4 Compact mobile layout (< `sm`): smaller title and spacing; chart 220px tall, all months visible via
      `compactLayout` (`features/clients/ui/clientsChartLayout.ts`); dense table (40px rows, `--tree-indent` 1rem).
      Chart dimensions are the only breakpoint-dependent values in JS (`useMediaQuery` + `mediaQueries.sm`).

### Phase 7 – Docs

- [x] T7.1 README: run/test, architecture, assumptions & open questions, next steps.

### Phase 7b – Code review follow-ups

- [x] R1 API runs a bundled build in production (tsdown), not tsx.
- [x] R2 API split by responsibility: avatars module, clients router → service → repository; composition root;
      `createApp(deps)` for dependency injection; env validated with zod (fails fast).
- [x] R3 `TreeTable` split: `useTreeGridFocus` (roving focus and interaction), `TreeTableHeader`, `TreeTableRow`,
      `treeTableStyles`; rows are found by `data-row-id` instead of a ref map.
- [x] R4 Layer rules enforced with ESLint; tests use `src/test/renderWithProviders` instead of `app/`.
- [x] R5 Dead code removed (knip), `npm run knip` + `npm run check`; GitHub Actions CI.
- [x] R6 `ChartLegend` no longer assumes a sibling `ChartDataTable`; small duplication removed.

### Phase 8 – Clients explorer (`/explorer`)

What and why (client-facing): [`IMPROVEMENTS.md`](IMPROVEMENTS.md). The main page stays exactly as it is.
Owner decisions are recorded there (section "Decisions").

**Key decisions**

- **One grid.** The chart is rendered _inside_ the tree table as extra header rows (`<thead>`): bar cells sit
  in the month columns, so alignment, shared horizontal scroll, shrinking and the sticky left column come from
  the table layout itself, with no width-syncing code. The month header row is the only month labelling.
  The chart rows are `aria-hidden`; the table itself and a live summary are the text alternative.
- **One screen.** The explorer is a single scroll container (both axes) filling the rest of the viewport. The
  `<thead>` (chart rows + month row) is `sticky top-0`, the hierarchy column `sticky left-0`, and the corner
  cell sticks on both axes, so only data rows scroll vertically while header and body scroll horizontally
  together. The sticky header (chart + month row) takes half of the explorer card, which
  is a CSS size container: chart `clamp(128px, 50cqh − month row, 420px)`; bar heights use the measured plot height
  (ResizeObserver), not SVG stretching, so radii and dotted grid lines stay true. Enabled from a minimum
  viewport height (480px); below it the page scrolls normally (no nested scroll on touch screens).
- **Pivot model.** The payload is flattened into facts `(branch, adviser, clientType, values[12])`; a pure
  `buildPivotTree(facts, dimensions)` builds the hierarchy for the chosen breakdown and sums values from the
  leaves (the extended dataset is consistent, so sums equal stored totals).
- **One chart rule.** The chart shows the selected row split by its children. Selection and breakdown live in
  the URL (`/explorer?by=branch&scope=<nodeId>`), so views are shareable and work with Back.
- **Stable colours.** Client types use the design colours; branches and advisers get colours from a validated
  categorical palette (load the `dataviz` skill), assigned by member, not by position.
- **Datasets.** `GET /api/clients?dataset=brief|extended` (default `brief`, validated). Separate JSON files
  behind the same repository interface.

**Tasks**

- [x] T8.1 Extended dataset: seeded generator script `apps/api/scripts/generate-extended-dataset.ts` →
      `modules/clients/data/clients.extended.json` (committed). Branch 1 keeps the brief's advisers and monthly
      totals; every adviser gets client types; every parent equals the sum of its children. Unit test asserts
      the invariants on the committed file.
- [x] T8.2 API: `dataset` query parameter (zod enum), repository per dataset, tests for both datasets and an
      invalid value (400).
- [x] T8.3 Pivot model (`features/client-explorer/model`): `toFacts`, `buildPivotTree`, breakdown configs
      (branch → adviser → type; type → branch → adviser; adviser → type, adviser shows its branch), node ids
      as stable paths. Unit tests: sums, ordering, each breakdown, totals equal across breakdowns.
- [x] T8.4 Colour model: `seriesColor(dimension, memberId)`; palette checked for contrast and
      distinguishability; client types keep the design colours. All advisers are shown; for the adviser
      breakdown the legend is a single hint line instead of a list.
- [x] T8.5 `TreeTable` extensions (generic, backwards compatible): `headerRows` slot rendered in `<thead>`
      before the column header; selection (`selectedId`, `onSelect`, `aria-selected`); `onRowActive` for
      hover/focus; configurable row click (`toggle` | `select`). Enter selects, Space toggles, arrows unchanged.
      Tests for all new behaviour plus axe.
- [x] T8.6 Column chart primitives in the chart kit: shared y scale for a set of columns, `StackColumn` (one
      month's stack in a table cell, rounded by clipping), grid lines per cell, highlight/dim states. Reuse
      `stackData`, `niceTicks`, `linearScale`.
- [x] T8.7 Control column (sticky, above the hierarchy column): "Break down by" segmented control (radio
      group), legend for the current series, y-axis labels, breadcrumb of the current scope.
- [x] T8.8 Explorer page: `pages/explorer/ExplorerPage.tsx` + route + navigation between the two pages; URL
      state; live region announcing "Chart: Branch 1 by adviser".
  - Navigation is one-way for now (explorer → dashboard): the main page stays identical to the Figma
    mockup. The explorer is reachable at `/explorer` and will be linked from the README (T8.12).
- [x] T8.9 Linking: hovering or focusing a leaf row highlights its segment (or its containing segment with
      its share marked) and shows a popover with the value; hovering a segment highlights its row; hovering a
      month highlights the column. Every hover state is also reachable by keyboard.
- [x] T8.10 Responsive (layout classes in place; visual check at 375px pending a dev-server run): below `sm` the controls move above the grid, and the pinned column keeps names and the
      y-axis only. No page overflow at 375px.
- [x] T8.11 Tests: page integration (breakdown switch re-pivots the table, row selection re-scopes the chart,
      leaf hover highlights), axe on the page, keyboard paths.
- [x] T8.12 Docs: README section "Clients explorer" (what it adds and why, link to `IMPROVEMENTS.md`),
      `DESIGN.md` for the new layout, `AGENTS.md` if conventions change.

### Backlog (ideas, not committed)

- Sticky y axis while the chart scrolls horizontally on small screens.
- Tooltip layer for the chart kit (hover + keyboard).
- Link chart and table (e.g. chart follows the selected row) – see README open questions.
- Bundle: `zod/mini` on the client, vendor chunking.
- Playwright smoke test in a real browser (axe incl. colour contrast); manual NVDA/VoiceOver pass.
