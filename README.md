# PTS

Therapy-focused product exploration + build scaffold.

## What this repo is
- A place to iterate on product scope, safety/privacy constraints, and build increments.
- Organized as a small monorepo:
  - `apps/` — user-facing apps (e.g., web)
  - `services/` — backend services (e.g., API)
  - `packages/` — shared libraries
  - `infra/` — deployment/runtime config
  - `docs/` — specs, plans, decision log

## Immediate next steps
1. Fill `docs/PROJECT_BRIEF.md` (who/what/why, initial use case: pain management).
2. Add a **data/privacy** posture in `docs/SAFETY_PRIVACY.md`.
3. Decide MVP slice in `docs/plans/` and build thin vertical slice.

## Autopilot

- Standing orders: `docs/AUTOPILOT_POLICY.md`
- Runbook: `docs/autopilot/RUNBOOK.md`
- Reports: `docs/autopilot/reports/` (one file per run; UTC timestamped)
- Note: the default branch is `master` (do not assume `main`).

## Local dev

### Cursor agent flow

- Repo-local Cursor SDK runner: `apps/cursor-runner/`
- See `docs/CURSOR_AGENT.md` for usage and verification status

### Web app

```bash
cd apps/web
npm ci
npm test
```

Notes:
- `npm test` runs eslint + Playwright end-to-end tests.
- The web app is intentionally local-only (no persistence / no PII storage).
