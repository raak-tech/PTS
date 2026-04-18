# PTS Autopilot

Goal: an *overnight* autopilot loop that converts product context into:
- architecture + sprint breakdown
- actionable tasks (GitHub issues)
- UX validation checklist + QA plan
- (later) automated test runs + bug filing

## What autopilot will do each run
1) **Context ingest**
   - Read: `docs/PROJECT_BRIEF.md`, latest office-hours + CEO plan docs, and `docs/SAFETY_PRIVACY.md`.
   - Read repo state: git diff, recent commits, open issues.

2) **Generate / update plans**
   - Write a dated report to: `docs/autopilot/YYYY-MM-DD-nightly.md`
   - Maintain:
     - `docs/ARCHITECTURE.md`
     - `docs/SPRINTS.md`
     - `docs/BACKLOG.md`

3) **Create/refresh issues**
   - Ensure issues exist for Sprint 0/1 tasks (labels, acceptance criteria).

4) **UX validation + QA**
   - Produce a UX checklist for the current sprint.
   - If runnable code exists: run tests + smoke checks.
   - If a browser flow exists: run Playwright smoke tests (later).

## Guardrails
- No matching/marketplace in v1 (explicitly deferred).
- No outcome promises: we commit to process + safety boundaries, not guaranteed benefits.
- Data minimization by default; persistence requires explicit consent + retention.

## Outputs to expect in chat
- A concise nightly summary (what changed, what to do next)
- Links/paths to generated docs
- Newly created/updated GitHub issues
