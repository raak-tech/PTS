# Project Brief - PTS

**Last updated:** 2026-04-19

## 1) One-liner
> PTS is a therapist-led, culturally attuned support ecosystem for people living with chronic musculoskeletal pain, delivered as a structured program with clear safety boundaries (not medical advice; not for emergencies).

## 2) Who it's for (primary user)
- Primary: people living with chronic musculoskeletal pain (back/neck/shoulder/hip/knee, etc.) who want sustained therapist guidance and structure.
- Secondary: India-based therapists delivering a protocolized program with consistent cadence and artifacts (weekly plan, check-in prompts).

## 3) The problem
- Current reality:
  - Care is episodic (doctor/physio visits) and rarely supports day-to-day adherence.
  - People fall back to generic content (videos, apps) without personalization or accountability.
- Pain points:
  - Adherence collapses without structure.
  - Chronic pain affects identity, mood, sleep, work, relationships; users need a biopsychosocial approach without over-claiming.
  - Cultural mismatch and stigma can reduce engagement and follow-through.
- Why now:
  - Users are actively seeking sustained, periodic intervention (not just one-off flare-up relief).

## 4) What it helps users do (no guarantees)
- Users will be able to:
  - Complete an intake, understand boundaries, and get routed to red-flags guidance when needed.
  - See a Week 1 plan (weekly focus + daily micro-practices) and track completion locally.
  - Complete a weekly check-in and reflection (local-only in Sprint 1).
- This product does not guarantee outcomes. It is support and structure, not diagnosis or emergency care.

## 5) Core use case (day-in-the-life)
1) User completes intake (goals, interference, context, red flags) and sees safety boundaries.
2) System shows a Week 1 plan with conservative guidance and next steps.
3) User uses a daily checklist (local-only) and optionally writes short reflections (local-only).
4) User completes a weekly check-in (local-only) to support therapist review in later phases.

## 6) Non-goals (important)
- Not a marketplace or matching product in v1.
- Not emergency or crisis support.
- No persistence of personal/health data in Sprint 1 (local-only UI state only; no analytics/telemetry).
- No external integrations in Sprint 1 (payments, SMS/email sending, calendar).

## 7) Success metrics (MVP)
- Activation:
  - Intake completed -> Week 1 plan page reached.
- Retention (process signals, not outcome promises):
  - Daily checklist completion rate (within-session in Sprint 1).
  - Weekly check-in completion rate (within-session in Sprint 1).
- Safety outcomes (process metrics):
  - Red-flags guidance is shown and reachable.
  - Guardrails copy is present and consistent on key pages.

## 8) Assumptions to validate
- Users want a structured 6-week cadence with small daily practices and weekly check-ins.
- A culturally fluent framing improves trust and adherence.
- Therapists benefit from protocolized weekly artifacts (summary + check-in + next-week plan) more than free-form messaging.

## 9) Constraints
- Clinical/scope boundaries:
  - Not medical advice; not for emergencies; avoid diagnosing or prescribing.
  - Conservative copy; no guaranteed outcomes.
- Privacy/regulatory posture (initial):
  - Data minimization: no persistence in Sprint 1; explicit consent + retention policy required before adding storage.
- Team/time/budget:
  - Prefer small, test-covered UI slices in apps/web.
