---
name: Orval TS2308 collision fix
description: How to avoid TS2308 type name collisions in Orval codegen
---

## Rule
If an OpenAPI endpoint has BOTH a path parameter (e.g. `{equipmentId}`) AND query parameters, Orval generates two types with the same base name causing TS2308. Fix by moving the item ID to a query parameter instead.

**Why:** Orval generates `GetXParams` for path params and also uses `GetXParams` for query params when both exist — they collide in the same file.

**How to apply:** 
- Change `/equipment/{equipmentId}/availability` → `/equipment/availability?equipmentId=...`
- Change `/utilization/equipment/{equipmentId}/stats` → `/utilization/stats?equipmentId=...`
- In route handlers, read from `req.query.equipmentId` instead of `req.params.equipmentId`
- After fixing the spec, always re-run: `pnpm --filter @workspace/api-spec run codegen`
