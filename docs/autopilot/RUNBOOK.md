# PTS Autopilot Runbook

This repo uses an autonomous "autopilot" loop to keep changes small, tested, and reviewable.

## Source of truth

- Standing orders: `docs/AUTOPILOT_POLICY.md`

## What autopilot does each run (high level)

Notes:
- Always target the repo's **default branch** as the PR base (currently `master`). Do not assume `main`.

1) If there are open autopilot PRs:
   - check out each PR branch
   - run the fastest suite (`apps/web`): `npm test`
   - if green and no stop-condition, squash-merge + delete branch
   - if red, create/update an issue with a short failure summary

2) Otherwise:
   - pick one small, safe task (docs/tests/refactor covered by tests)
   - open a PR
   - run `apps/web` tests
   - merge when green

## Reports

- Write a per-run report under `docs/autopilot/reports/`.
- Use a unique UTC timestamp in the filename to avoid cron collisions.
  Recommended (minute precision):
  - `docs/autopilot/reports/YYYY-MM-DD-HHMM-UTC.md`
  If a collision ever occurs (multiple runs within the same minute), append seconds or a short suffix:
  - `docs/autopilot/reports/YYYY-MM-DD-HHMMSS-UTC.md`
  - `docs/autopilot/reports/YYYY-MM-DD-HHMM-UTC-2.md`
- Do not overwrite older reports; write a new file per run.

## Local verification (apps/web)

```bash
cd apps/web
npm ci
npm test
```

Notes:
- `npm test` runs lint and Playwright E2E for the web app.
- Keep changes reversible and avoid force-push.

### Playwright strict-mode locator scoping (common gotcha)
Playwright strict mode fails when a locator matches multiple elements. This can happen when UI intentionally repeats link text in shared navigation (e.g., "Back to intake" in both a page footer and a program nav).

Preferred convention: scope locators to a labeled container.

Examples:
```ts
// Scope to the shared navigation region
const programNav = page.getByRole('navigation', { name: /program navigation/i });
await programNav.getByRole('link', { name: /back to intake/i }).click();

// Scope to the main content region
const main = page.getByRole('main');
await main.getByRole('link', { name: /back to intake/i }).click();
```

If a shared block is hard to target, consider adding an accessible label in the UI:
- `<nav aria-label="Program navigation">`
- `<section aria-label="Safety & Boundaries">`

## Stop-conditions (must not proceed without explicit approval)

See `docs/AUTOPILOT_POLICY.md`. Key examples:
- storing user PII / health data
- adding analytics/telemetry
- external integrations (payments, messaging, deployments)
- destructive git ops (history rewrites)
- outcome-claim language in product copy
