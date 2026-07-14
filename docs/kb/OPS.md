# Ops & release knowledge

## Environments

| Env | URL / note |
|-----|------------|
| Production web | https://pts-web-pied.vercel.app |
| Preview | `vercel deploy` from `apps/web` (unique URL each time) |
| Local web DB | Postgres `pts` via unix socket if `DATABASE_URL` unset |
| Shared Neon | Production + Preview often share `DATABASE_URL` — treat preview writes as real data |

## Critical env vars (web)

See `apps/web/.env.example` and `docs/BEFORE_PRODUCTION.md`. Never commit live keys.

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Neon / Postgres |
| `OPENROUTER_API_KEY` | Intake + plan LLM |
| `OTP_TEST_MODE` | Fixed OTP `123456` (pilot only) |
| `MSG91_*` | Live SMS — required when test mode removed |
| `ADMIN_EMAILS` | Web admin |
| `PAIN_SCRIPT_ENABLED` | Pain-script pathway on preview/prod as configured |

`vercel env pull` may show empty encrypted values; runtime can still work — verify with `/api/health` and `/api/health/llm`.

## Deploy

```bash
cd apps/web && npx vercel deploy --yes          # preview
cd apps/web && npx vercel deploy --prod --yes   # production
```

Mobile installs hit **production** API unless `EXPO_PUBLIC_API_URL` points elsewhere.

## Sharing with collaborators

- **iOS builder (API = prod):** only `apps/mobile/.env` with `EXPO_PUBLIC_API_URL` + optional `EXPO_PUBLIC_PILOT_COHORT=pain_script` — see `.env.example`.
- **Full local stack:** also need web secrets (OpenRouter, DB) via secure channel — not Slack plain text.
- Do **not** share root `.env.local` Vercel OIDC tokens.

## Test OTP

While `OTP_TEST_MODE=true`: registered phones accept `123456`. Numbers matching `+919900000*` may always accept fixed OTP per `MOBILE_AUTH.md`.
