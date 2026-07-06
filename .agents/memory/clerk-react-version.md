---
name: Clerk React version pinning
description: @clerk/react 5.x is a broken release; must use 6.x for the frontend
---

## Rule
Always use `@clerk/react@^6.7.0` or later for the frontend. Do NOT use `@clerk/react@5.x`.

**Why:** `@clerk/react@5.54.0` is a broken/misversioned release that imports `loadClerkUiScript`, `clerkUiScriptUrl`, `buildClerkUiScriptAttributes` from `@clerk/shared@3.47.7`, but those exports do not exist in that version. The stable production series is 6.x. (As of 2026-07-05, latest stable is 6.11.3.)

**How to apply:** When installing Clerk for a new React frontend, run:
```
pnpm --filter @workspace/lab-platform add @clerk/react@6.11.3 @clerk/themes
```

Also add `@clerk/shared`, `@clerk/react`, `@clerk/themes` to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` so same-day Clerk monorepo releases can be paired correctly.
