# PTS Sprints (Draft)

This file is the canonical sprint breakdown. Autopilot keeps it updated.

## Sprint 0 - Product + Safety + Architecture (now)
**Goal:** lock MVP scope (musculoskeletal chronic pain), define program model, and define "what we build".

Deliverables:
- Program definition (6-week track template)
- Provider workflow definition (minimal)
- UX flows (wire-level)
- QA plan + acceptance criteria

## Sprint 1 - Thin vertical slice (no persistence)
**Goal:** client intake -> generate week-1 plan -> daily checklist + check-in.

Acceptance criteria (Sprint 1):
- User can complete intake and reach a Week 1 plan page.
- User can navigate to a Daily Checklist page (local-only; no server persistence).
- User can navigate to a Weekly Check-in page (local-only; no server persistence).
- Safety/guardrail copy is present on key pages (eg, local-only and not medical advice).
- Red-flags routing exists and is high-salience:
  - If any red flag is indicated, user is routed to /red-flags and the coaching flow is blocked.
  - /red-flags is reachable from intake and from inside the program (plan/daily/check-in).
  - No persistence of red-flag answers by default (treat as highly sensitive).
- No matching/marketplace work is introduced in v1.

Artifacts (Sprint 1):
- Manual QA smoke checklist: docs/qa/sprint-1-smoke-checklist.md
- Next tasks (issues): #68 #69 #70 #71

## Sprint 2 - Provider console + persistence hardening + consent controls
**Goal:** let providers review assigned clients, make conservative weekly plan updates, and tighten consented storage.

Deliverables:
- #135 Provider dashboard with assigned clients and review status
- #136 Client detail review panel with conservative weekly plan updates
- #137 Provider-client linking via invite code or admin assignment
- #138 Granular consent controls and revocation behavior
- #139 Retention, export, and deletion audit trail for support data
- #140 Playwright coverage for provider workflow and consent controls

## Sprint 3 - Quality + instrumentation
**Goal:** automated QA, metrics, and operational tooling.
