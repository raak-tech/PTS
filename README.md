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

**Pilot execution queue:** [`docs/PILOT_TODO.md`](docs/PILOT_TODO.md)

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
npm run db:migrate
npm test
```

### Mobile app (Expo prototype)

```bash
cd apps/mobile
npm install
npm run web    # http://localhost:8081
```

See `apps/mobile/README.md` and `docs/MOBILE_APP_UX.md`.

Notes:
- `npm test` runs eslint + Playwright end-to-end tests.
- The web app now defaults to PostgreSQL with consent-gated storage for support artifacts.
