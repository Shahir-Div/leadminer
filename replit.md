# LeadMiner AI

A local-first business research workspace that discovers, organizes, and maintains a high-quality database of publicly available business information.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/leadminer run dev` — run the frontend (served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, wouter, shadcn/ui, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (businesses, searchSessions, logs, settings)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/leadminer/src/` — React frontend (pages, components)

## Architecture decisions

- Search sessions simulate a live research pipeline: creating a session immediately returns a "running" record, then a background async function populates sample businesses and marks the session "completed" after ~3 seconds. The frontend polls `useGetSearch` every 2 seconds while status is running.
- Settings are stored as key/value rows in the `settings` table with in-code defaults (no migration needed when adding new settings).
- Export returns the file content as a base64/text string in JSON; the frontend creates a Blob and triggers a browser download.
- The `businesses/export` route intentionally sits before `businesses/:id` in the router so `/export` isn't treated as an ID param.

## Product

- **Dashboard** — live stats (total businesses, searches, email/website coverage), discovery growth chart, category breakdown, recent activity feed
- **Search** — launch research sessions with keyword + location + category; live progress polling; cancel support
- **Results** — paginated filterable sortable table of all businesses; click to open full profile
- **Business Details** — complete profile with contact, location, social, notes (auto-saved), sources, metadata
- **Exports** — CSV/JSON download of all or selected records
- **Settings** — theme, browser config, cache, logging preferences
- **Logs** — filterable application event log with clear/export
- **About** — version and system info

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen` and then `pnpm run typecheck:libs` before checking artifact packages.
- The `businesses/export` route must be registered before `businesses/:id` in the router.
- The simulate search function in `searches.ts` uses a dynamic import of `businessesTable` — this is intentional to avoid circular dependency issues at module load time.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
