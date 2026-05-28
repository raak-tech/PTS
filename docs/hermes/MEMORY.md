# PTS — Project Memory

Purpose: durable “memory” for how we run this project.
This is where we put conventions, runbooks, and recurring answers.

## Serious Project Mode (contract)
- Plan first, then execute.
- No code changes without a plan link under `docs/plans/`.
- If we must skip a plan: record `PLAN_WAIVED: <reason>` in `docs/autopilot/reports/...` before executing.
- Verification gates are non-optional: `npm test` (eslint + Playwright). If DB changes, also run migrations.

## Where things live
- Plans: `docs/plans/`
- Decisions: `docs/DECISIONS.md`
- Backlog: `docs/BACKLOG.md`
- Safety/privacy posture: `docs/SAFETY_PRIVACY.md`
- Consent/retention: `docs/CONSENT_AND_RETENTION.md`
- Hermes runbook: `docs/hermes/RUNBOOK.md`
- Rolling notes: `docs/hermes/NOTES.md`
- Current status: `docs/hermes/STATUS.md`

## Daily status automation
- Hermes cron job posts daily status (9:00 IST) based on git + docs.

