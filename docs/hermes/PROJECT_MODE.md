# PTS — Serious Project Mode (Hermes)

This repo runs in “serious mode”: every change is tied to an explicit plan, verified, and leaves durable traces (decisions + status).

This is inspired by the best parts of oh-my-codex/OMX:
- default workflow: interview → plan → execute → verify → review
- durable state folder contract (in our case: `docs/` + `docs/hermes/`)
- lightweight roles (planner/executor/reviewer) and explicit handoffs
- verification gates (tests/linters/e2e) treated as non-optional

## The default workflow (copy/paste)

1) Clarify (Interview)
- Define user, job-to-be-done, constraints (privacy/safety), and acceptance criteria.

2) Plan (1 page)
- Create a short plan doc under `docs/plans/`:
  - Goal
  - Non-goals
  - Proposed changes
  - Risks (privacy/safety)
  - Verification steps
  - Rollback

3) Execute (small PR-sized steps)
- Make the smallest change that moves the plan forward.
- Keep changes measurable (one feature / one slice).

4) Verify (must pass)
- Web app: `npm test` (eslint + Playwright)
- If DB changes: ensure migration runs (`npm run db:migrate`)
- If auth/storage touched: re-check consent/retention docs.

5) Review + record
- Update `docs/DECISIONS.md` for any new decision.
- Update `docs/BACKLOG.md` if scope changed.

## Hard rule: no execution without a plan link

- Every execution task MUST reference a plan doc under `docs/plans/`.
- Allowed exceptions are rare and must be written down first in `docs/autopilot/reports/...` as: "PLAN_WAIVED: <reason>".

Practical meaning:
- If we are about to change code, we first create/update a plan file and then execute.
- PR descriptions must include the plan file path.

## Minimum “done” definition (for any task)
- Plan exists and is linked (or explicitly waived in writing as above)
- Code builds / lints / tests pass
- Evidence is captured in the PR description or a `docs/autopilot/reports/...` entry
- A single owner is responsible for follow-up tasks

## Repo-specific anchors
- Autopilot policy: `docs/AUTOPILOT_POLICY.md`
- Safety & privacy posture: `docs/SAFETY_PRIVACY.md`
- Consent/retention: `docs/CONSENT_AND_RETENTION.md`
- Backlog: `docs/BACKLOG.md`
- Decisions: `docs/DECISIONS.md`
