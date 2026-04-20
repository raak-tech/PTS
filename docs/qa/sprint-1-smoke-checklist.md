# Sprint 1 Web Smoke Checklist (Manual)

Scope: Sprint 1 thin vertical slice (no persistence)
Flow: intake -> plan -> daily checklist + weekly check-in + flare-up protocol, with red-flags routing.

Non-negotiables:
- No outcome guarantees in copy.
- Not medical advice.
- Not for emergencies.
- Local-only / no storage (no server writes; no localStorage/sessionStorage).

## Preflight
1) Run automated tests:
   - cd apps/web && npm test

## Smoke: happy path
1) Load intake (/)
   - Page loads without errors.
   - Required fields show clear labels.

2) Submit with valid inputs (no red flags)
   - Expected: navigates to /plan
   - Expected: plan page shows a Week 1 plan heading.

3) From /plan, open each program page:
   - /daily (Daily Checklist)
   - /check-in (Weekly Check-in)
   - /flare-up (Flare-up Protocol)

4) Verify navigation back to intake
   - Each page has a clear "Back to intake" link.

## Smoke: red flags routing
1) From intake (/), indicate possible red flag symptoms.
2) Submit intake.
   - Expected: navigates to /red-flags
   - Expected: coaching flow is blocked (no plan generation).

## Copy checks (safety)
On each key page (/plan, /daily, /check-in, /flare-up, /red-flags):
- The Safety & Boundaries block is visible.
- It includes:
  - "This is not medical advice."
  - "This is not for emergencies" guidance.
  - A link to /red-flags.

## A11y quick checks (keyboard)
1) Use Tab to reach the primary navigation links on each page.
2) Use Enter to activate a link.
3) On intake, submit empty form:
   - Expected: focus moves to the first invalid field.
   - Expected: error text is visible and connected via aria-describedby.

## Notes
If any of the above fails, create an issue with:
- URL
- Steps to reproduce
- Expected vs actual
- Screenshot (optional)
- Console errors (if any)
