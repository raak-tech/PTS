# PTS stack + functionality reference

**Last updated:** 2026-05-05

This file is the quick reference for the project so future runs do not need a long context pass.

## Runtime stack
- **Repo root:** `/home/satananth/projects/PTS`
- **Web app:** `apps/web`
- **Framework:** Next.js 16
- **Language:** TypeScript
- **UI:** React
- **ORM:** Drizzle ORM
- **DB driver:** `postgres` package via `drizzle-orm/postgres-js`
- **Local database:** PostgreSQL 16 on `127.0.0.1:5433`
- **Default DB URL:** `postgresql://<current-linux-user>@127.0.0.1:5433/pts` unless `DATABASE_URL` is set

## Backend behavior
- The app now defaults to **PostgreSQL**, not SQLite.
- Dev migration entrypoint: `apps/web/scripts/migrate.mjs`
- Drizzle schema: `apps/web/src/db/schema.ts`
- DB access wrapper: `apps/web/src/db/index.ts`

## Product functionality currently in the repo
### Client-facing flows
- **`/`** — intake flow
- **`/plan`** — Week 1 plan
- **`/daily`** — daily checklist
- **`/check-in`** — weekly check-in
- **`/red-flags`** — safety guidance
- **`/login` / `/register` / `/logout` / `/forgot-password` / `/reset-password`** — auth flows
- **`/support`** — consent and storage controls
- **`/support/export`** — human-readable export of stored support artifacts

### Data model
- `users`
- `sessions`
- `password_reset_tokens`
- `user_consents`
- `support_artifacts`
- `invite_codes`
- `email_outbox`

### Important policy notes
- Support storage is **consent-gated**.
- Reflection encryption is optional and controlled by consent.
- The product is still framed as a structured support program, not a marketplace.

## How to run locally
- Start/verify PostgreSQL first.
- Then from `apps/web`:
  - `npm ci`
  - `npm run db:migrate`
  - `npm test`

## Useful reminders
- The default branch is `master`.
- `apps/web/.data/` is already gitignored for local DB/runtime data.
