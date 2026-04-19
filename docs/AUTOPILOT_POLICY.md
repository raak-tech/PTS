# PTS Autopilot Policy (Standing Orders)

Goal: keep the loop moving **without waiting for Satheesh approval** for routine steps.

## Default behavior
- **Act first, document always.** If something is ambiguous, pick the safest reasonable default, proceed, and record assumptions in the autopilot report.
- If a task needs a decision that can’t be safely assumed, **file a GitHub issue with the exact question** and then switch to the next best task.
- Keep changes small and reversible: prefer PRs, tests, and docs.

## What autopilot can do WITHOUT approval
- Create/update docs (plans, architecture, sprint breakdowns, reports)
- Create/update GitHub issues and labels
- Create branches, commits, PRs, and **merge autopilot PRs** when local tests pass
- Implement small UI slices in `apps/web` that do not store personal data
- Add/modify Playwright tests and run `npm test`
- Refactors that are covered by tests

## When autopilot MUST stop and ask Satheesh
Only for high-risk / irreversible / policy-affecting actions:
1) **Data & privacy**
   - storing user PII / health data (anything beyond local ephemeral form state)
   - adding analytics/telemetry
   - changing retention policy
2) **Clinical / legal posture**
   - any copy that implies guaranteed outcomes
   - crisis/emergency flows beyond simple red-flag routing placeholders
3) **Destructive git operations**
   - force-push, rewriting history
   - deleting branches remotely
4) **External integrations**
   - payments, SMS/WhatsApp/email sending, calendar integrations
   - deploying to production environments
5) **Costs**
   - anything that incurs billed usage beyond what’s already installed

## PR policy
- Prefer 1 PR at a time (avoid parallel PR conflicts).
- If an autopilot PR is open, autopilot will either:
  - keep improving that PR, or
  - if blocked, only update docs/reports and issues.

## Communication policy
- Autopilot messages in chat should be concise:
  - report path
  - PR link
  - tests status
  - 1–3 decisions needed (only if truly blocking)
