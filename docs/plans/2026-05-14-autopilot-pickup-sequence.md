# Autopilot Pickup Sequence (Serious Mode)

Date: 2026-05-14

Goal: enter auto-execution mode and move the PTS backlog forward in a safe, plan-first way.

## Constraints
- Plan first, then execute.
- No execution without a plan link.
- Default to docs-first tasks (Sprint 0) before code-heavy work.
- Maintain safety/privacy posture.

## Proposed execution sequence (this run)

### Phase 0 — Setup (today)
1) Fill `docs/hermes/STATUS.md` with current focus, next actions, and link this plan.
2) Ensure repo-memory docs remain the source of truth.

### Phase 1 — Sprint 0 docs (highest leverage)
3) Tighten and finalize the 6-week program template (`docs/program/6-week-template.md`).
4) Tighten provider workflow (`docs/PROVIDER_WORKFLOW.md`) and align language with privacy constraints.
5) Validate client UX flow doc (`docs/UX_FLOW.md`) has consistent safety/"no persistence" statements; extract/confirm UX validation checklist.

### Phase 2 — Sprint 1 web vertical slice (after docs are stable)
6) Implement or validate routes: `/` → `/plan` → `/daily` → `/check-in` → `/red-flags` in `apps/web` with no persistence.
7) Add/confirm Playwright e2e for core navigation + basic accessibility requirements.

### Phase 3 — Sprint 2 provider console (after Sprint 1 is solid)
8) Work through issue order: #135 → #136 → #137 → #138 → #139 → #140.

## Verification
- For docs-only changes: ensure consistency across docs; no code execution needed.
- For web changes:
  ```bash
  cd apps/web
  npm ci
  npm run db:migrate
  npm test
  ```

## Rollback
- Revert individual commits or PRs; keep changes small.
