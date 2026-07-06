# Lab Resource Utilization Platform

A full-stack platform for research institutions to manage equipment inventory, schedule shared resource access, monitor real-time utilization, track maintenance workflows, and analyze resource efficiency.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Wouter routing, shadcn/ui, Recharts, framer-motion
- Auth: Clerk (Replit-managed) — `@clerk/react` v6.x on frontend, `@clerk/express` v2.x on backend
- API: Express 5 with contract-first OpenAPI spec (Orval codegen)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle ORM schema files
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/lab-platform/src/` — React frontend

## Architecture decisions

- Contract-first: all API contracts defined in OpenAPI, hooks and schemas generated via Orval
- Clerk proxy: API server proxies Clerk traffic at `/__clerk` so frontend Clerk runs through same origin
- Auth is cookie-based (no Bearer tokens); `requireAuth` middleware uses `getAuth()` from `@clerk/express`
- Availability/utilization stats endpoints use query-only params (no path params with query params combined) to avoid Orval TS2308 type collisions
- `@clerk/react` must be pinned to v6.x (NOT v5.x — that's a broken release); companion `@clerk/shared` 3.x excluded from minimumReleaseAge

## Product

- Equipment inventory: searchable/filterable catalog with status tracking (AVAILABLE/BOOKED/UNDER_MAINTENANCE/OUT_OF_SERVICE/RETIRED)
- Booking management: request, approve/reject, cancel with waitlist support
- Utilization monitoring: heatmap visualization, idle equipment detection, per-equipment stats
- Maintenance tracking: scheduled preventive/corrective/calibration/inspection workflows
- Inter-institution sharing: agreement management, shared equipment discovery
- Analytics dashboard: booking trends, top equipment, cost analysis by department, sharing stats
- Admin console: user management with role-based access (RESEARCHER/LAB_TECHNICIAN/LAB_MANAGER/DEPT_HEAD/INSTITUTION_ADMIN/SYSTEM_ADMIN)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT use `@clerk/react@5.x` — it's a broken release where the package depends on `@clerk/shared` exports that don't exist in the available version. Use `^6.7.0` or later.
- Run codegen after any OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- After DB schema changes: `pnpm --filter @workspace/db run push` then restart the API server workflow
- The `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` includes `@clerk/shared`, `@clerk/react`, `@clerk/themes` to allow same-day Clerk releases to be paired correctly

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
