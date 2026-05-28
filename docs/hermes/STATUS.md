# PTS — Current Status

This is the single source of truth for current state and next actions.
Update this whenever we complete a meaningful step or change direction.

## Current focus
- Entering auto-execution mode (serious project mode): stabilize Sprint 0 docs first, then proceed to Sprint 1 web slice.

## Next actions (top 5)
1) Finalize 6-week program template: docs/program/6-week-template.md
2) Align provider workflow doc with consent/retention constraints: docs/PROVIDER_WORKFLOW.md
3) Ensure client UX flow doc is consistent + extract build-ready checklist: docs/UX_FLOW.md
4) After docs are stable: implement/verify Sprint 1 web routes and navigation (no persistence)
5) Add/confirm Playwright coverage for core route navigation + basic a11y assertions

## Latest plan
- docs/plans/2026-05-14-autopilot-pickup-sequence.md

## Risks / open questions
- Ensure copy never drifts into medical advice / outcome guarantees.
- Keep Sprint 1 truly no-persistence (no backend calls, no analytics).
- Decide when Sprint 2 provider console work starts (after Sprint 1 is stable).

## Verification
Docs-only steps: consistency check across docs.

Web steps:
```bash
cd apps/web
npm ci
npm run db:migrate
npm test
```
