# Sprint 1 UX Validation Checklist and QA Smoke Plan

Scope: Sprint 1 thin vertical slice (no persistence) for apps/web.
Guardrails: no matching/marketplace in v1; no outcome promises; data minimization.

## UX validation checklist (human walkthrough)

### 1) Intake page
- Page loads without console errors.
- Form labels are clear and accessible.
- Required fields show clear validation copy.
- No collection of unnecessary PII (keep inputs minimal).
- Safety copy is present (local-only, not medical advice).

### 2) Generate Week 1 plan
- Generate button routes to a plan page.
- Plan page has a clear title and readable sections.
- Plan page includes safety/guardrail copy (local-only, not medical advice).
- No language implying guaranteed outcomes.

### 3) Daily checklist (local-only)
- Plan page provides a clear link to open the daily checklist.
- Daily checklist page loads and shows the intended heading.
- Items are checkable without server calls.
- Safety/guardrail copy is present.

### 4) Weekly check-in (local-only)
- Plan page provides a clear link to open weekly check-in.
- Weekly check-in page loads and shows the intended heading.
- Form fields are minimal and do not request unnecessary sensitive data.
- Safety/guardrail copy is present.

### 5) Red flags routing (non-emergency guidance only)
- If red flags are indicated, the UI routes to a safe, non-emergency guidance stub.
- Copy avoids clinical claims and avoids emergency instruction beyond placeholders.

## QA smoke test plan (automated)

Primary command (apps/web): npm test

Must cover:
- Intake to Week 1 plan navigation.
- Plan to Daily checklist navigation.
- Plan to Weekly check-in navigation.
- Red flags routing.

CI expectation (when added):
- eslint must pass.
- Playwright e2e must pass in headless mode.

## Evidence checklist for bug reports
When filing issues, include:
- URL and exact steps to reproduce.
- Expected vs actual behavior.
- Console errors (if any).
- Screenshot if visual or copy-related.
