# Sprint 0 Decision Brief: Delivery Model + Primary Metric

## Context
PTS is a therapist-led, culturally attuned support ecosystem for chronic musculoskeletal pain.
V1 is a structured 6-week program with clear safety boundaries.

Constraints (Sprint 1):
- No persistence of personal/health data
- No external integrations (payments/SMS/email/calendar)
- No outcome-claim language

## Decision 1: Delivery model
Decision: structured 6-week program first (hybrid check-ins later), not unlimited chat.

What Sprint 1 ships:
- Client web flow: / (intake) -> /plan (Week 1 plan) -> /daily -> /check-in -> /red-flags
- Daily + check-in are local/session UI state only
- Strong disclaimers + red-flag routing

## Decision 2: Primary metric (MVP)
Decision: process-first activation metric.

Primary metric:
- Activation = intake completed -> user reaches /plan

Secondary engagement signals:
- Daily checklist interaction (>= 1 item checked)
- Weekly check-in interaction (>= 1 prompt answered)

## Notes
- This aligns with docs/PROJECT_BRIEF.md ("Success metrics" section).
- Any persistence/analytics should wait for explicit consent + retention policy.
