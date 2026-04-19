# Project Brief - PTS

**Last updated:** 2026-04-19

## 1) One-liner
> PTS is a therapist-led, culturally attuned support ecosystem for people living with chronic musculoskeletal pain, delivered as a structured 6‑week program with clear safety boundaries (not medical advice; not for emergencies; no outcome guarantees).

## 2) Target users
- **Primary (client):** people living with **chronic musculoskeletal pain** (back/neck/shoulder/hip/knee, etc.), from varied causes/events, who want sustained guidance and structure (beyond episodic appointments).
- **Secondary (provider):** **India-based therapists** delivering a protocolized track with consistent cadence and artifacts (weekly plan, daily micro‑practices, weekly check‑in prompts).

## 3) Market & positioning
- **Market stance:** India-based providers, clients can be global.
- **Initial distribution advantage:** Indian expats (cultural fluency, expectations, stigma, family/work dynamics).
- **V1 is not matching:** we are not building a therapist marketplace/matching funnel in v1.
- **Product shape (v1 direction):** a *hybrid program* (structured track + therapist check-ins in later phases), not unlimited chat.

## 4) The problem (why users struggle today)
- Care is often **episodic** (doctor/physio) with low continuity for day‑to‑day adherence.
- People fall back to **generic content** (YouTube stretches, meditation apps) that is not personalized or accountable.
- Chronic pain is **biopsychosocial** (sleep, mood, identity, work, relationships); users need a combined approach without over-claiming.
- Cultural mismatch and stigma reduce engagement and follow-through.

## 5) What we deliver (what it helps users *do*)
PTS helps users:
- complete a brief intake and understand **scope/safety boundaries**
- get a **Week 1 plan** (conservative pacing + micro‑practices)
- track **daily micro‑practices** and write optional reflection
- complete a **weekly check‑in** (reflection + barriers + next-week adjustment)
- get routed to **red-flags guidance** when indicated

## 6) Intervention model (modalities)
- **Primary:** **CTA (Acceptance & Commitment Therapy)** framing and skills (values-based action, acceptance, cognitive defusion, committed action).
- **Support:** **CBT micro-skills** where appropriate (thought/behavior patterns, coping strategies) without positioning as treatment/diagnosis.
- **Physio-adjacent coaching:** safe, conservative **movement/pacing checklists** (non-diagnostic; no prescribing; emphasize “comfortable range only”).

## 7) Core client use case (day-in-the-life)
1) Client completes intake (pain area, short-term goal, red-flags checkbox) and sees disclaimers.
2) Client receives a Week 1 plan (static in Sprint 1) with conservative guidance.
3) Client uses a daily checklist and optional reflection (session-only in Sprint 1).
4) Client completes a weekly check-in (session-only in Sprint 1).
5) If red flags are present, client is routed to safety guidance to seek in-person evaluation.

## 8) MVP scope (software)
Client web routes (Sprint 1):
- `/` intake
- `/plan` Week 1 plan
- `/daily` daily checklist (local-only)
- `/check-in` weekly check-in (local-only)
- `/red-flags` safety guidance

## 9) Non-goals (v1)
- Not a therapist marketplace, lead gen, or matching product.
- Not emergency/crisis support.
- Not diagnosis, prescribing, or medical triage.
- No persistence of personal/health data in Sprint 1 (local session UI state only).
- No external integrations in Sprint 1 (payments, calendar, SMS/email sending, EHR).

## 10) Success metrics (MVP; process not outcomes)
- **Activation:** intake completed → user reaches `/plan`.
- **Engagement signals:**
  - daily checklist interaction (at least 1 item checked)
  - weekly check-in interaction (at least 1 prompt answered)
- **Safety/process:**
  - red-flags guidance reachable from intake and from plan/guardrails
  - disclaimers/guardrails present on key pages and consistent

## 11) Assumptions to validate
- Users want a **6-week cadence** with small daily practices and weekly check-ins.
- CTA-first framing improves perceived control/self-efficacy and adherence.
- Cultural fluency (esp. for Indian expats) improves trust and follow-through.
- Providers benefit from a protocolized program more than free-form messaging.

## 12) Key risks & mitigations
- **Scope confusion (medical vs therapy vs coaching):** strong disclaimers, conservative copy, red-flags routing.
- **Too broad wedge (“any pain”):** keep focus on chronic musculoskeletal pain + program cadence.
- **Provider variance (later phases):** protocolized track + QA rubric + supervision.
- **Measurement ambiguity:** prioritize a small set of process metrics before any outcomes.

## 13) Constraints
- **Clinical boundaries:** not medical advice; not for emergencies; avoid diagnosing/prescribing; no guaranteed outcomes.
- **Privacy posture (initial):** data minimization; no persistence in Sprint 1; before storage add explicit consent + retention policy.
- **Build constraints:** prioritize small, test-covered vertical slices in `apps/web`.
