# Sprint 1 UX Validation Checklist (Build-ready)

Source of truth: extracted from `docs/UX_FLOW.md` so it can be used as a QA artifact.

## Content + scope
- [ ] “Not medical advice” + “Not for emergencies” shown on `/` and `/red-flags`.
- [ ] Guardrails are visible on `/plan`, `/daily`, `/check-in`.
- [ ] No outcome promises; language is process-focused (adherence, pacing, reflection).

## Navigation
- [ ] `/` submit routes:
  - [ ] red-flags checked → `/red-flags`
  - [ ] otherwise → `/plan`
- [ ] `/plan` links to `/daily` and `/check-in`.
- [ ] `/daily` provides links back to `/plan` and `/`.
- [ ] `/check-in` provides link back to `/plan`.
- [ ] `/plan` or guardrails provide a visible link to `/red-flags`.

## Validation + accessibility
- [ ] Intake required fields show inline errors on submit.
- [ ] Error messages use `role="alert"`; inputs set `aria-invalid`.
- [ ] Focus moves to first invalid input on submit.
- [ ] Labels are present and properly associated with inputs.

## Data posture
- [ ] No backend calls; no persistence beyond in-memory React state.
- [ ] No analytics/telemetry events.
- [ ] Copy clearly states “local-only / not saved” where relevant.

## Resilience
- [ ] Reset buttons clear session state without reload.
- [ ] Refreshing the page clears state (expected in Sprint 1); copy does not imply persistence.
