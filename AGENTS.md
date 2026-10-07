# AGENTS.md

Guidance for coding agents (Claude Code, Codex, Cursor) and humans working in this repo.

## Start here

1. `docs/PLAN.md` – architecture, decisions and task list. Keep checkbox state current.
2. `docs/DESIGN.md` – visual spec extracted from Figma (the Figma file is not accessible to every agent).
3. `docs/Nevis Frontend Home Assignment.pdf` – the original brief and data payload.
4. `README.md` – how to run, assumptions and open questions.

## Stack

- npm workspaces: `apps/api` (Express 5), `apps/web` (Vite + React 19), `packages/shared` (zod schema + types).
- TypeScript 6 strict. Tailwind CSS v4 (CSS-first config, tokens in `apps/web/src/index.css` `@theme`).
- React Router (lazy routes), TanStack Query for server state. No global state library – local state is enough.
- Own SVG chart kit in `apps/web/src/shared/ui/chart/` – do not add a chart library.
- Tests: Vitest everywhere; Testing Library + user-event in web; supertest in api.

## Commands (run from repo root)

```bash
npm install          # install all workspaces
npm run dev          # api on :3001 + web on :5173 (proxies /api and /avatars)
npm test             # all tests
npm run typecheck    # tsc --noEmit in every workspace
npm run lint         # eslint
npm run format       # prettier --write
npm run knip         # dead code: unused files, exports, dependencies
npm run check        # everything CI runs: typecheck, lint, format, knip, tests
npm run build        # API bundle (tsdown) + web app (Vite)
```

Before declaring a task done, `npm run check` must pass: typecheck, lint (including the layer rules),
formatting, knip (dead code) and tests. CI runs the same command.

## Structure and boundaries (web)

`app → pages → features → shared` – a layer imports only from layers to its right.

- `app/` – providers, router, layout, app-wide error page.
- `pages/` – thin route components that compose features.
- `features/<name>/` – `api/` (fetching + query options), `model/` (pure domain logic), `ui/`, public `index.ts`.
  Other code imports a feature only through its `index.ts`.
- `shared/` – domain-agnostic code: `api/httpClient`, `config/env`, `lib/`, `ui/` (primitives, `chart/`, `tree-table/`).

The layering is enforced by `no-restricted-imports` in `eslint.config.js`. Deep imports into a feature are
only allowed for its `testing/` fixtures.

API: `createApp(deps)` builds the HTTP app from injected dependencies; `composition.ts` is the composition
root (the only place that picks implementations); HTTP concerns live in `src/http/`; each domain lives in
`src/modules/<name>/` as `*.router.ts` (HTTP), `*.service.ts` (logic) and `*.repository.ts` (data access).
The environment is validated in `config.ts`. Production runs the tsdown bundle (`dist/server.js`), not tsx.

## Conventions

- **Contract**: the payload schema lives in `packages/shared`; the web validates responses with it at the boundary.
- **Adapters**: payload keys (`branches`/`employees`/`channels`) are mapped to the uniform `ClientNode` only in
  `features/clients/model/clientTree.ts`. UI components never read raw payload keys.
- **Components**: presentational components get data via props and never fetch. Shared components stay
  domain-agnostic (no imports from `features/`).
- **Pure logic first**: data mapping (chart data, months, totals) is a pure function with a unit test.
- **Errors**: HTTP failures surface as `ApiError` (`network` | `http` | `invalid-response`); widgets are wrapped
  in `ErrorBoundary`; never swallow errors silently.
- **Styling**: Tailwind utilities with theme tokens (`bg-surface`, `text-muted`, …), never raw hex in components.
  `clsx` for conditional classes. Inline styles only for computed values (indentation, sizes, series colours).
- **Accessibility**: `TreeTable` follows the WAI-ARIA treegrid pattern; changes must keep the keyboard and ARIA
  tests in `TreeTable.test.tsx` green. Prefer role/name queries in tests.
- **Imports (web)**: inside a module (a feature, a `shared/ui` kit, a `shared/*` folder) use short relative
  paths (`./x`, `../model/x`); everything else uses the `@/` alias for `apps/web/src` (e.g. `@/shared/ui/Card`).
  ESLint rejects `../../` paths and sorts imports into groups: packages, `@nevis/*`, `@/`, relative.
- **Naming**: components `PascalCase.tsx`, hooks `useX.ts`, everything else `camelCase.ts`. Named exports only
  (default exports only where a tool requires them). Component files export components only.
- **Tests** sit next to the code: `Foo.tsx` + `Foo.test.tsx`.
- **Data**: `apps/api/src/modules/clients/data/clients.json` is verbatim from the brief. Do not "fix" numbers.
  The only enrichment is `avatarUrl` on employees (images in `apps/api/public/avatars`).
- **Two pages**: `/` must keep matching the Figma mockup (`docs/DESIGN.md`); `/explorer` is our own design
  (`docs/IMPROVEMENTS.md`, client-facing – keep it in sync when the explorer changes).
- **Datasets**: `?dataset=brief` (default, verbatim) and `extended` (generated: `npm run generate:extended -w @nevis/api`,
  deterministic; never edit the JSON by hand).
- **Chart colours** of the explorer live in `features/client-explorer/model/palette.ts` and were validated for CVD and
  contrast; change them only by re-running a palette validator. Colours follow the entity, never its position.
- **One-screen layouts** use the `fit:` Tailwind variant (≥ 640px wide and tall) and a route `handle` with
  `fullHeight: true` (`app/routeHandle.ts`).
- Keep comments sparse – explain _why_, not _what_.
- Do not commit unless the repo owner asks.
