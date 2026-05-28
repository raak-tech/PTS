# Sprint 0 Docs Consistency Checklist

Goal: keep Sprint 0 docs aligned so Sprint 1 implementation is straightforward.

## Must be consistent across docs

- Product posture:
  - Not medical advice
  - Not for emergencies
  - No outcome guarantees

- Data posture (Sprint 1):
  - No persistence of personal/health data
  - No backend calls
  - No analytics/telemetry
  - Local-only UI state

- Safety routing:
  - Red flags route to /red-flags guidance
  - Red flags: do not provide exercise/progression advice beyond seek care

- Provider console posture (later):
  - Provider can only access assigned clients
  - Any storage requires explicit consent per docs/CONSENT_AND_RETENTION.md

## Canonical docs to review
- docs/PROJECT_BRIEF.md
- docs/UX_FLOW.md
- docs/SAFETY_PRIVACY.md
- docs/CONSENT_AND_RETENTION.md
- docs/program/6-week-template.md
- docs/PROVIDER_WORKFLOW.md

## Output of this checklist
- If mismatch found, fix the doc (docs-only PR-sized change).
- If decision needed, record in docs/DECISIONS.md.
