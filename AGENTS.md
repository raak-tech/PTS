# PTS — agent instructions

This repository uses a **durable knowledge base**. Read it before mobile/release/intake work; update it after incidents.

## Start here

1. **Execution queue:** [`docs/PILOT_TODO.md`](docs/PILOT_TODO.md)
2. **Knowledge base:** [`docs/kb/README.md`](docs/kb/README.md)
3. **Workflow:** [`docs/DEV_WORKFLOW.md`](docs/DEV_WORKFLOW.md) (Analyze → Specify → Review → Build)
4. **Decisions:** [`docs/DECISIONS.md`](docs/DECISIONS.md)

## App-specific

- Mobile: [`apps/mobile/AGENTS.md`](apps/mobile/AGENTS.md) + [`docs/kb/MOBILE.md`](docs/kb/MOBILE.md)
- Web: [`apps/web/AGENTS.md`](apps/web/AGENTS.md)
- Counselor web: [`docs/kb/COUNSELOR_WEB.md`](docs/kb/COUNSELOR_WEB.md) + IA [`docs/plans/2026-07-15-counselor-chart-ia.md`](docs/plans/2026-07-15-counselor-chart-ia.md) + ship [`docs/plans/2026-07-15-counselor-chart-ia-ship.md`](docs/plans/2026-07-15-counselor-chart-ia-ship.md)
- Latest ship (2026-07-16): [`docs/plans/2026-07-16-intake-counselor-client-bridge-ship.md`](docs/plans/2026-07-16-intake-counselor-client-bridge-ship.md) — intake exit, ready-pool, Your counselor

## Continuous capture & review

- After crashes / hard fixes: skill **capture-learning** → update `docs/kb/*` + `CAPTURE_LOG.md`
- Weekly / on request: skill **kb-review** → `docs/kb/REVIEW_CHECKLIST.md`
- Cursor rules: `.cursor/rules/` (always-on KB rule + path-scoped mobile/intake rules)

## Do not

- Commit secrets or paste API keys into docs
- Create Expo `foo.tsx` beside `foo/` (see KB INCIDENTS 2026-07-14)
- Build or install mobile APK unless the user explicitly asks
- Build a counselor marketplace / client shopping for counselors (see `DECISIONS.md` 2026-07-16)
