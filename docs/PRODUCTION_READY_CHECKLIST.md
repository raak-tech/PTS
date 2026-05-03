# PTS Production-Ready Core Checklist

This checklist defines what "production-ready at a core level" means for PTS.

**Principles**
- Conservative posture: no outcome promises; process commitments only.
- Data minimization by default.
- Safety-first: red flags block coaching flow.
- Quality gates are automated (tests + lint in CI).

---

## 0) Scope + Roles (must be explicit)

- [ ] Roles defined:
  - [ ] Client (program participant)
  - [ ] Provider (therapist / coach)
  - [ ] Admin (ops; can be future, but responsibilities must be stated)
- [ ] Supported platforms defined (web first; mobile later).

## 1) Safety + Boundaries (non-negotiable)

- [ ] "Not medical advice" copy present on all program pages.
- [ ] "Not for emergencies" copy present and high-salience.
- [ ] Red-flags handling:
  - [ ] Red flags can be indicated during intake.
  - [ ] If red flags indicated, user is routed to `/red-flags`.
  - [ ] Red flags **block** plan generation / coaching flow.
  - [ ] Red flags guidance is reachable from inside the program.
- [ ] No copy implies guaranteed outcomes.

## 2) Data classes + lifecycle (must be documented)

- [ ] Data classes defined (even if not persisted yet):
  - [ ] Intake
  - [ ] Plan (week-by-week)
  - [ ] Daily checklist
  - [ ] Weekly check-in
  - [ ] Red flags
- [ ] For each class: defined fields, sensitivity level, and lifecycle.

## 3) Consent + retention (required before persistence)

- [ ] Consent specification exists (what is stored, why, for how long).
- [ ] Retention + deletion/export requirements are defined.
- [ ] "Never store by default" list is explicit (red flags is the default example).

## 4) Provider workflow (what makes this a therapist support platform)

- [ ] Weekly provider review loop is documented.
- [ ] Provider artifacts are defined:
  - [ ] client summary
  - [ ] adherence/progress snapshot
  - [ ] red flags status (present/unknown)
  - [ ] recommended adjustments (non-prescriptive wording)
- [ ] Provider console screens are defined (wire-level is acceptable initially).

## 5) UX + Accessibility baseline

- [ ] Keyboard-only navigation works for key flows.
- [ ] Skip-to-content works on initial load AND after client-side navigation.
- [ ] Form validation is accessible (focus management + aria-describedby).
- [ ] A11y checks exist (automated where feasible).

## 6) QA + Engineering Quality Gates

- [ ] Local dev command documented.
- [ ] `apps/web` test suite exists and is reasonably fast.
- [ ] CI runs for PRs and blocks merge on failures.
- [ ] No console errors policy (at least as a smoke test).

## 7) Security baseline

- [ ] Threat model exists at a high level (what we protect against).
- [ ] Secrets are never committed.
- [ ] Dependencies are pinned and installed via lockfile.

## 8) Deployment readiness (core)

- [ ] Staging environment defined.
- [ ] Build is reproducible in CI.
- [ ] Basic monitoring/logging approach is stated (even if minimal).

---

## Definition of Done

A change set is "production-ready core" when:
- all checklist items above are satisfied (or explicitly deferred with rationale), and
- tests pass locally and in CI.
